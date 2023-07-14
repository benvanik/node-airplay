import { EventEmitter } from "node:events";
import { parse } from "plist";
import { Client } from "./client.js";

import type { ResponseWaiter, ParsedResponse } from "./client.js";

export type ReadyCallback = (device: Device) => void;

export interface DeviceInfo {
  id: number;
  name: string;
  deviceId: string;
  features: unknown[];
  model: string;
  slideshowFeatures: unknown[];
  supportedContentTypes: unknown[];
}

export interface Info {
  host: string;
  port: number;
  serviceName: string;
}

export interface ServerInfo {
  features: unknown[];
  model: string;
}

export class Device extends EventEmitter {
  private serverInfo: ServerInfo | null = null;
  private ready: boolean = false;
  private client: Client | null;

  constructor(public id: number, private info: Info, readyCallback?: ReadyCallback) {
    super();

    const { host, port } = info;
    const user = "Airplay";
    const pass = "";

    this.client = new Client(host,port,user,pass,() => {
      // TODO: support passwords
      this.client!.get("/server-info",res => {
        parse(res.body,(err, obj) => {
          var el = obj[0];
          this.serverInfo = {
            deviceId: el.deviceid,
            features: el.features,
            model: el.model,
            protocolVersion: el.protovers,
            sourceVersion: el.srcvers
          };
        });

        this.makeReady(readyCallback);
      });
    });
  }

  isReady(): boolean {
    return this.ready;
  }

  private makeReady(readyCallback?: ReadyCallback): void {
    this.ready = true;
    readyCallback?.(this);
    this.emit("ready");
  }

  close(): void {
    this.client?.close();
    this.client = null;
    this.ready = false;

    this.emit("close");
  }

  getInfo(): DeviceInfo {
    const { id, info, serverInfo } = this;
    const { serviceName: name, host: deviceId } = info;
    const { features, model } = serverInfo!;
    return { id, name, deviceId, features, model, slideshowFeatures: [], supportedContentTypes: [] };
  }

  getName(): string {
    return this.info.serviceName;
  }

  matchesInfo(info: Info): boolean {
    for (var key in info) {
      if (this.info[key] != info[key]) {
        return false;
      }
    }
    return true;
  }

  default(callback): void {
    if (callback) {
      callback(this.getInfo());
    }
  }

  status(callback?: ResponseWaiter): void {
    this.client!.get("/playback-info", (res) => {
      if (res) {
        parse(res.body, (err, obj) => {
          var el = obj[0];
          var result = {
            duration: el.duration,
            position: el.position,
            rate: el.rate,
            playbackBufferEmpty: el.playbackBufferEmpty,
            playbackBufferFull: el.playbackBufferFull,
            playbackLikelyToKeepUp: el.playbackLikelyToKeepUp,
            readyToPlay: el.readyToPlay,
            loadedTimeRanges: el.loadedTimeRanges,
            seekableTimeRanges: el.seekableTimeRanges
          };
          if (callback) {
            callback(result);
          }
        });
      } else {
        callback?.(null);
      }
    });
  }

  authorize(req, callback?: ResponseWaiter): void {
    // TODO: implement authorize
    callback?.(null);
  }

  play(content, start, callback?: ResponseWaiter): void {
    const body = "Content-Location: " + content + "\n" +
      "Start-Position: " + start + "\n";
    this.client!.post("/play",body,res => {
      callback?.(res ? {} as ParsedResponse : null);
    });
  }

  stop(callback?: ResponseWaiter): void {
    this.client!.post("/stop",null,res => {
      callback?.(res ? {} as ParsedResponse : null);
    });
  }

  scrub(position, callback?: ResponseWaiter): void {
    this.client!.post("/scrub?position=" + position,null,res => {
      callback?.(res ? {} as ParsedResponse : null);
    });
  }

  reverse(callback?: ResponseWaiter): void {
    this.client!.post("/reverse",null,res => {
      callback?.(res ? {} as ParsedResponse : null);
    });
  }

  rate(value, callback?: ResponseWaiter): void {
    this.client!.post("/rate?value=" + value,null,res => {
      callback?.(res ? {} as ParsedResponse : null);
    });
  }

  volume(value, callback?: ResponseWaiter): void {
    this.client!.post("/volume?value=" + value,null,res => {
      callback?.(res ? {} as ParsedResponse : null);
    });
  }

  photo(req, callback?: ResponseWaiter): void {
    // TODO: implement photo
    callback?.(null);
  }
}