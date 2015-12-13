var os = require('os')
var exec = require('child_process').exec;
var deasync = require('deasync')
var getIP = deasync(require('external-ip')())
var _ = require('underscore')

function getMac() {
  var interfaces = _.find(os.networkInterfaces(),function (value,key) {
    return key.indexOf('w')==0 || key.indexOf('e')==0
  })
  return require('crypto').createHash('md5').update(interfaces[0].mac).digest("hex")
}

function execute(command, callback){
    exec(command, function(error, stdout, stderr){ callback(stdout); });
};

module.exports = function () {
  execute('./node_modules/natman/bin/natman open 8080 8080',function function_name(argument) {
  })

  var obj={}
  obj.name = os.hostname()
  obj.id = getMac()
  obj.ip = getIP()
  return obj
}
