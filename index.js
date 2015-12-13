#! /usr/bin/env node

var Player = require('player');
var request = require("request")
var clc = require('cli-color');
var express = require('express');
var pubnub = require('./core/pub')
var utils = require('./core/utils')
var self = require('./init')()
var _ = require('underscore')
var stations ={}
var songs=[]
var radioIntervalId
var isPlaying = false
var app = express()
var current;
var player = new Player()
var error = clc.red.bold;
var warn = clc.yellow;
var notice = clc.green;
var userArgs = process.argv.slice(2);

function printNotice(argument) {
  console.log(notice(argument));
}

function printError(argument) {
  console.log(error(argument));
}

function printWarn(argument) {
  console.log(warn(argument));
}

printNotice('Zeal Initialized...')

pubnub.subscribe("zeal",function(message) {
  var station = JSON.parse(message)
  stations[station.id]=station
})



var stdin = process.openStdin();
stdin.on( 'data', function(chunk) {
  var input = chunk.toString().trim()

  if(input == "pause")
    player.pause()

  if(input == "radio"){
    if(userArgs[0] == undefined){
      printError('Please provide a path to the folder of music you wish to share...')
      process.exit(1)
    }
    if(isPlaying){
      isPlaying=false
      clearInterval(radioIntervalId)
      player.stop()
      player = new Player();
      printWarn('Stopped broadcasting...')
    }
    else{
      isPlaying=true

      var fileCount = utils.walk(userArgs[0], function(filePath, stat) {
        var filename = require('crypto').createHash('md5').update(filePath+stat).digest("hex")
        var name = filePath.split('/')[filePath.split('/').length -1].split('.mp3')[0]
        var link='/'+filename
        songs.push({name:name,link:'http://'+self.ip+':8080'+link})
        app.get(link,function (req,res) {
          res.sendFile(filePath)
        })
      });

      if(fileCount ==0){
        printError('The directory path you provided had no mp3 file...')
        process.exit(1)
      }

      printNotice(fileCount + ' files found...\n')
      _.each(songs, function (arg) {
        console.log('  '+warn(arg.name));
      })

      printNotice('_________________________________________________________\n')

      radioIntervalId = setInterval(function () {
        pubnub.publish("zeal", JSON.stringify(self))
      },1000)

      player = new Player(_.map(songs,function (argument) {
        return argument.link
      }))
      player.stop()
      player.play()

      player.on('playing',function(item){
        var name = _.find(songs,function (arg) {
          return arg.link == item.src
        })
        current = {name:name.name,data:item.src}
        console.log(warn('Currently playing : ')+notice(current.name));
        pubnub.publish(self.name+self.id, JSON.stringify(current))
      });

      player.on('error', function(err){
        // when error occurs
        console.log(error(err));
      });

      app.get('/current',function (req,res) {
        res.send(current)
      })
    }

  }

  if(input == "stations"){
    if(_.size(stations) == 0){
      printWarn('No one seems to be up yet...')
      return
    }

    if(isPlaying){
      printWarn("You are still broadcasting. Turn it off to view stations...")
      return
    }
    _.each(stations,function (argument) {
      console.log(warn('Name: ')+notice(argument.name)+' | '+warn('ID: ')+notice(argument.id));
    })
  }
  if(input.indexOf("connect")==0){
    var station = _.find(stations,function (v,k) {
      return k == input.split(' ')[1]
    })
    if(station == undefined){
      printError('No such station...')
      return
    }
    request({
      url: 'http://'+station.ip+':8080/current',
      json: true
    }, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        player.stop()
        player=new Player(body.data)
        player.play()
        player.on('error', function(err){
          // when error occurs
          if(err = "No next song was found")
            printWarn('Waiting for next song...')
        });
        console.log(warn('Currently playing : ')+notice(body.name));
      }
    })
    pubnub.subscribe(station.name+station.id,function (message) {
      var body = JSON.parse(message)
      player.stop()
      setTimeout(function() {
        player = new Player(body.data);
        player.play(function(err, player){
          console.log(err);
        });
        player.on('error', function(err){
          // when error occurs
          if(err = "No next song was found")
            printWarn('Waiting for next song...')
        });
        console.log(warn('Currently playing : ')+notice(body.name));
      },2000)
    })
  }
})

player.on('error', function(err){
  // when error occurs
  console.log(err);
});

app.listen(8089);
