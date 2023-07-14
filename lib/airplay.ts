export { Browser } from './airplay/browser.js';
export { Device } from './airplay/device.js';

import { Browser } from './airplay/browser.js';

export function createBrowser(): Browser {
  return new Browser();
}

export function connect(host: string, port: number, pass?: unknown): never {
  // TODO: connect
  throw 'not yet implemented';
}