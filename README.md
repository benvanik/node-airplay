node-airplay -- AirPlay client library for node.js
====================================

node-airplay is a client library for Apple's
[AirPlay](http://en.wikipedia.org/wiki/AirPlay) remote playback protocol.
It implements a simple AirPlay device browser using mdns and command interface.

Currently supported features:
* AirPlay device discovery
* Support for audio and video playback

Coming soon (maybe):
* Photo playback
* Robust error handling
* Better device information formatting (supported features/etc)

## Quickstart

    npm install airplay
    node
    > var airplay = require('airplay');
    > var browser = airplay.createBrowser();
    > browser.on('deviceOnline', function(device) {
        device.play('http://host/somevideo.mp4', 0, function(res) {
          if (res) {
            console.log('playing!');
          } else {
            console.log('unable to play!');
          }
        });
      });

## Installation

With [npm](http://npmjs.org):

    npm install airplay

From source:

    cd ~
    git clone https://benvanik@github.com/benvanik/node-airplay.git
    npm link node-airplay/

node-airplay depends on both node_mdns and node-plist. Unfortunately neither
stored in the npm repo work correctly, and as such the package points to forks
I have made. Hopefully this will be resolved soon.

## API

### Browser

The browser is a discovery service that can be run to automatically detect the
AirPlay-compatiable devices on the local network(s). Try only to create one
browser per node instance, and if it's no longer needed stop it.

Create a browser using the `createBrowser` method:

    var browser = require('airplay').createBrowser();

Attach to the browser events to track device discovery:

    browser.on('deviceOnline', function(device) {
      // store device off
    });
    browser.on('deviceOffline', functino(device) {
      // stop caching the device
    });

Start or stop the discovery process:

    browser.start();
    browser.stop();

If you are running a server you can use the built-in device list instead of
maintaining your own via the events:

    function myHandler() {
      var devices = browser.getDevices();
      // do something with the list of devices
    }

### Device

A device instance represents a single AirPlay device on the local network.
Devices are created either through the discovery process or by direct
connection. Each device has only a single control channel, and all methods are
asynchronous.

Obtain devices using the browser API:

    var device = browser.getDevices()[0];
    // all devices that come out of getDevices are already ready

*TODO* At some point, you'll be able to connect directly:

    var device = require('airplay').connect('hostname', port);
    device.on('ready', function() {
      // ready to accept commands
    });

If you are done with the device, close the connection (note that this will stop
any playback):

    device.close();

Issue various device control calls:

    device.getStatus(function(res) {
      // res = {
      //   duration: number, -- in seconds
      //   position: number, -- in seconds
      //   rate: number, -- 0 = paused, 1 = playing
      //   ...
      // }
    });

    var content = 'http://host/content.mp4';
    var startPosition = 0; // in seconds
    device.play(content, startPosition, function(res) {
      if (res) {
        // playing
      }
    });

    device.stop(function(res) {
      if (res) {
        // stopped
      }
    });

    var position = 500; // in seconds
    device.scrub(position, function(res) {
      if (res) {
        // seeked
      }
    })

    // NOTE: may not be supported
    device.reverse(function(res) {
      if (res) {
        // reversed
      }
    });

    var rate = 0; // 0 = pause, 1 = resume
    device.rate(rate, function(res) {
      if (res) {
        // rate changed
      }
    });

    // NOTE: may not be supported
    device.volume(value, function(res) {
      if (res) {
        // volume changed
      }
    });
