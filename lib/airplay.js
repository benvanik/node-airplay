exports.Browser = require('./airplay/browser').Browser;
exports.createBrowser = function() {
  return new exports.Browser();
};

exports.Device = require('./airplay/device').Device;
exports.connectDevice = function(host, port, pass) {
  // TODO: connect
  return null;
};
