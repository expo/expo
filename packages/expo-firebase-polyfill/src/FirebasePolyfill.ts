import { btoa, atob } from './Base64';
import { getRandomValues } from './Crypto';

// @ts-ignore
if (!global.btoa) {
  // @ts-ignore
  global.btoa = btoa;
}

// @ts-ignore
if (!global.atob) {
  // @ts-ignore
  global.atob = atob;
}

// @ts-ignore
if (!global.crypto || !global.crypto.getRandomValues) {
  // @ts-ignore
  global.crypto = global.crypto || {};
  // @ts-ignore
  global.crypto.getRandomValues = getRandomValues;
}
