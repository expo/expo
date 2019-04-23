import { CodedError } from '@unimodules/core';
import qs from 'qs';
import { NativeError } from '../Bluetooth.types';

function _removePort(url) {
  return url.replace(/(?=([a-zA-Z0-9+.-]+:\/\/)?[^/]):\d+/, '');
}

function splitURL(url) {
  const [uri, params] = _removePort(url).split('?');
  return {
    uri,
    params: qs.parse(params),
  };
}

function getFullObjectFromSingleTrace(encodedString) {
  const info = encodedString.split('@').map(value => decodeURI(value));
  if (info.length === 1) {
    return { uri: splitURL(info[0]) };
  }

  return {
    command: info[0],
    uri: splitURL(info[1]),
  };
}

function getCommandFromSingleTrace(encodedString) {
  const info = encodedString.split('@').map(value => decodeURI(value));
  return info[0];
}

export default class BluetoothError extends CodedError implements NativeError {
  log() {
    console.log(JSON.stringify(this.toJSON(), null, 2));
  }

  toJSON(): { [key: string]: any } {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      stack: JSON.parse(this.stack || '{}'),
    };
  }

  constructor({ name = 'expo-bluetooth', message, stack, code }: { [key: string]: any }) {
    super(code || 'ERR_BLE_UNKNOWN', message);
    this.name = name;
    if (stack) {
      // Just use the first few lines
      const stackComponents = stack
        .split('\n')
        .slice(0, 5)
        .map((encodedString, index) => {
          // return getFullObjectFromSingleTrace(encodedString)
          return `${index}: ${getCommandFromSingleTrace(encodedString)}`;
        });
      this.stack = JSON.stringify(stackComponents);
    }
  }
}
