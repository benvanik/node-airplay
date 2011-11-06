var events = require('events');
var mdns = require('mdns');
var util = require('util');

var Device = require('./device').Device;

var Browser = function() {
  var self = this;

  this.devices_ = {};
  this.nextDeviceId_ = 0;

  this.browser_ = mdns.createBrowser(mdns.tcp('airplay'));
  this.browser_.on('serviceUp', function(info, flags) {
    var device = self.findDeviceByInfo_(info);
    if (!device) {
      device = new Device(self.nextDeviceId_++, info);
      self.devices_[device.id] = device;
      device.on('ready', function() {
        self.emit('deviceOnline', device);
      });
      device.on('close', function() {
        delete self.devices_[device.id];
        self.emit('deviceOffline', device);
      });
    }
  });
  this.browser_.on('serviceDown', function(info, flags) {
    var device = self.findDeviceByInfo_(info);
    if (device) {
      device.close();
    }
  });
};
util.inherits(Browser, events.EventEmitter);
exports.Browser = Browser;

Browser.prototype.findDeviceByInfo_ = function(info) {
  for (var deviceId in this.devices_) {
    var device = this.devices_[deviceId];
    if (device.matchesInfo(info)) {
      return device;
    }
  }
  return null;
};

Browser.prototype.getDevices = function() {
  var devices = [];
  for (var deviceId in this.devices_) {
    var device = this.devices_[deviceId];
    if (device.isReady()) {
      devices.push(device);
    }
  }
  return devices;
};

Browser.prototype.getDeviceById = function(deviceId) {
  var device = this.devices_[deviceId];
  if (device && device.isReady()) {
    return device;
  }
  return null;
};

Browser.prototype.start = function() {
  this.browser_.start();
};

Browser.prototype.stop = function() {
  this.browser_.stop();
};
