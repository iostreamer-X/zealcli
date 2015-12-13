module.exports.walk = function (currentDirPath, callback) {
  var fs = require('fs'), path = require('path');
  var counter =0;
  fs.readdirSync(currentDirPath).forEach(function(name) {
    var filePath = path.join(currentDirPath, name);
    var stat = fs.statSync(filePath);
    if (stat.isFile()) {
      if(filePath.endsWith(".mp3")){
        callback(filePath, stat);
        counter++
      }
    } else if (stat.isDirectory()) {
      require('./utils').walk(filePath, callback);
    }
  });
  return counter
}
