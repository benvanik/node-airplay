import { EventEmitter } from "node:events";
import { createBrowser, tcp } from "mdns";
import { Device } from "./device.js";

import type { Info } from "./device.js";

export class Browser extends EventEmitter {
  private devices: Record<number,Device> = {};
  private nextDeviceId: number = 0;
  private browser = createBrowser(tcp("airplay"));

  constructor() {
    super();

    this.browser.on("serviceUp",(info: Info, flags) => {
      let device = this.findDeviceByInfo(info) ?? new Device(this.nextDeviceId++,info);
      this.devices[device.id] = device;

      device.on("ready",() => {
        this.emit("deviceOnline",device);
      });

      device.on("close",() => {
        delete this.devices[device.id];
        this.emit("deviceOffline",device);
      });
    });

    this.browser.on("serviceDown",(info: Info, flags) => {
      let device = this.findDeviceByInfo(info);
      device?.close();
    });
  }

  private findDeviceByInfo(info: Info): Device | null {
    for (const deviceId in this.devices){
      const device = this.devices[deviceId];
      if (device.matchesInfo(info)){
        return device;
      }
    }
    return null;
  }

  getDevices(): Device[] {
    const devices: Device[] = [];
    for (const deviceId in this.devices){
      const device = this.devices[deviceId];
      if (device.isReady()){
        devices.push(device);
      }
    }
    return devices;
  }

  getDeviceById(deviceId: number): Device | null {
    const device = this.devices[deviceId];
    if (device && device.isReady()){
      return device;
    }
    return null;
  }

  start(): void {
    this.browser.start();
  }

  stop(): void {
    this.browser.stop();
  }
}