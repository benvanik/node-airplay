import { EventEmitter } from "node:events";
import { createConnection } from "node:net";

import type { Socket } from "node:net";

export type ResponseWaiter = (response: ParsedResponse | null) => void;

export interface ParsedResponse {
  statusCode: number;
  statusReason: string;
  headers: Record<string, string>;
  body: string;
}

export class Client extends EventEmitter {
  private responseWaiters: { callback: ResponseWaiter; }[] = [];
  private socket: Socket | null;

  constructor(private host: string, private port: number, private user: string, private pass: string, callback: ResponseWaiter) {
    super();
    this.socket = createConnection(this.port,this.host);

    this.socket.on("connect",() => {
      this.responseWaiters.push({ callback });
      this.socket!.write(
        "GET /playback-info HTTP/1.1\n" +
        "User-Agent: MediaControl/1.0\n" +
        "Content-Length: 0\n" +
        "\n");
    });

    this.socket.on("data",data => {
      const res = this.parseResponse(data.toString());
      //util.puts(util.inspect(res));
      const waiter = this.responseWaiters.shift();
      waiter?.callback(res);
    });
  }

  close(): void {
    this.socket?.destroy();
    this.socket = null;
  }

  private parseResponse(res: string): ParsedResponse {
    // Look for HTTP response:
    // HTTP/1.1 200 OK
    // Some-Header: value
    // Content-Length: 427
    // \n
    // body (427 bytes)
    let header = res;
    let body = "";
    const splitPoint = res.indexOf("\r\n\r\n");

    if (splitPoint != -1){
      header = res.substr(0,splitPoint);
      body = res.substr(splitPoint + 4);
    }

    // Normalize header \r\n -> \n
    header = header.replace(/\r\n/g,"\n");

    // Peel off status
    const status = header.substr(0,header.indexOf("\n"));
    const statusMatch = status.match(/HTTP\/1.1 ([0-9]+) (.+)/)!;
    header = header.substr(status.length + 1);

    // Parse headers
    const allHeaders: Record<string,string> = {};
    const headerLines = header.split("\n");

    for (let n = 0; n < headerLines.length; n++){
      const headerLine = headerLines[n];
      const key = headerLine.substr(0,headerLine.indexOf(":"));
      const value = headerLine.substr(key.length + 2);
      allHeaders[key] = value;
    }

    // Trim body?
    return {
      statusCode: parseInt(statusMatch[1]),
      statusReason: statusMatch[2],
      headers: allHeaders,
      body
    };
  }

  private issue(req, body: string | null, callback: ResponseWaiter): void {
    if (!this.socket){
      console.error("client not connected");
      return;
    }

    req.headers = req.headers || {};
    req.headers["User-Agent"] = "MediaControl/1.0";
    req.headers["Content-Length"] = body ? Buffer.byteLength(body) : 0;
    req.headers["Connection"] = "keep-alive";

    let allHeaders = "";
    for (let key in req.headers){
      allHeaders += key + ": " + req.headers[key] + "\n";
    }

    let text = req.method + " " + req.path + " HTTP/1.1\n" + allHeaders + "\n";
    if (body !== null){
      text += body;
    }

    this.responseWaiters.push({ callback });
    this.socket.write(text);
  }

  get(path: string, callback: ResponseWaiter): void {
    const req = { method: "GET", path };
    this.issue(req,null,callback);
  }

  post(path: string, body: string | null, callback: ResponseWaiter): void {
    const req = { method: "POST", path };
    this.issue(req,body,callback);
  }
}