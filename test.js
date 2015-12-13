var Player = require('player');
var request = require("request")
var express = require('express');
var qs = require('querystring');
var app = express();
var songs =[]

function walk(currentDirPath, callback) {
  var fs = require('fs'), path = require('path');
  fs.readdirSync(currentDirPath).forEach(function(name) {
    var filePath = path.join(currentDirPath, name);
    var stat = fs.statSync(filePath);
    if (stat.isFile()) {
      callback(filePath, stat);
    } else if (stat.isDirectory()) {
      walk(filePath, callback);
    }
  });
}

walk('/home/iostreamer/Downloads/Sound Cloud', function(filePath, stat) {
  var filename = require('crypto').createHash('md5').update(filePath+stat).digest("hex")
  var name = filePath.split('/')[filePath.split('/').length -1].split('.mp3')[0]
  var link='/'+filename
  console.log('https://itunes.apple.com/search?'+qs.stringify({'term':name})+'&limit=2');
  songs.push('http://localhost:8080'+link)
  app.get(link,function (req,res) {
    res.sendFile(filePath)
  })

  request({
    url: 'https://itunes.apple.com/search?'+qs.stringify({'term':name})+'&limit=2',
    json: true
  }, function (error, response, body) {

    if (!error && response.statusCode === 200) {
      console.log(body.resultCount) // Print the json response
    }
  })
});

// create player instance
var player = new Player(songs);

// play now and callback when playend
player.play(function(err, player){
  console.log(err);
});

player.on('playing',function(item){
  console.log(item);
});

setTimeout(function() {
  player.stop()
  setTimeout(function() {
    player = new Player(songs);
    player.play(function(err, player){
      console.log(err);
    });
  },2000)
},5000)

app.listen(8080);
