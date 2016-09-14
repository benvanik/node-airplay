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

## Example

```js
const browser = require('airplay').createBrowser();

browser.on('deviceOnline', (device) => {
  device.play('http://host/somevideo.mp4', 0);
});

browser.start();
```

## Installation

With [npm](http://npmjs.org):
```console
npm install airplay --save
```

node-airplay depends on both
[node-plist](https://github.com/TooTallNate/node-plist) and
[node_mdns](https://github.com/agnat/node_mdns). Unfortunately
node_mdns is woefully out of date and has required many tweaks to get working,
resulting in [a fork](https://github.com/benvanik/node_mdns).

If you're running node on FreeBSD (or maybe Linux) you may get errors during
install about a missing dns_sd.h file. If so, install the Apple mDNS SDK:

```console
wget http://www.opensource.apple.com/tarballs/mDNSResponder/mDNSResponder-522.1.11.tar.gz
tar zxvf mDNSResponder-522.11.tar.gz
cd mDNSResponder-333.10/mDNSPosix/
sudo gmake os=freebsd install
```

## API

### Browser

The browser is a discovery service that can be run to automatically detect the
AirPlay-compatiable devices on the local network(s). Try only to create one
browser per node instance, and if it's no longer needed stop it.

Create a browser using the `createBrowser` method:
```js
const browser = require('airplay').createBrowser();
```

Attach to the browser events to track device discovery:
```js
browser.on('deviceOnline', (device) => {
  console.log('device online: ' + device.id);
});
browser.on('deviceOffline', (device) => {
  console.log('device offline: ' + device.id);
});
```

Start or stop the discovery process:
```js
browser.start();
browser.stop();
```

If you are running a server you can use the built-in device list instead of
maintaining your own via the events:
```js
function myHandler() {
  const devices = browser.getDevices();
  console.log(devices);
}
```
### Device

A device instance represents a single AirPlay device on the local network.
Devices are created either through the discovery process or by direct
connection. Each device has only a single control channel, and all methods are
asynchronous.

Obtain devices using the browser API:
```js
// Get all ready devices
const allDevices = browser.getDevices();
// Grab a device to play with
const device = allDevices[0];
```

*TODO* At some point, you'll be able to connect directly:
```js
const device = require('airplay').connect(deviceHost);
device.on('ready', () => {
  // Ready to accept commands
});
```

If you are done with the device, close the connection (note that this will stop
any playback):
```js
device.close();
```

Issue various device control calls. All calls are asynchronous and have an
optional callback that provides the result - for most, it's an empty object if
the call was successful and null if the call failed.

```js
// Get the current playback status
device.getStatus(function(res) {
  // res = {
  //   duration: number, -- in seconds
  //   position: number, -- in seconds
  //   rate: number, -- 0 = paused, 1 = playing
  //   ...
  // }
  // or, if nothing is playing, res = {}
});

// Play the given content (audio/video/etc)
const content = 'http://host/content.mp4';
const startPosition = 0; // in seconds
device.play(content, startPosition, (res) => {
  if (res) {
    // playing
  } else {
    // failed to start playback
  }
});

// Stop playback and return to the main menu
device.stop();

// Seek to the given offset in the media (if seek is supported)
const position = 500; // in seconds
device.scrub(position);

// Reverse playback direction (rewind)
// NOTE: may not be supported
device.reverse();

// Change the playback rate
// NOTE: only 0 and 1 seem to be supported for most media types
const rate = 0; // 0 = pause, 1 = resume
device.rate(rate);

// Adjust playback volume
// NOTE: may not be supported
device.volume(value);
```
