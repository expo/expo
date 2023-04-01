/**
 * The UpdatesEvent emitter implementation
 */
import { DeviceEventEmitter } from 'expo-modules-core';
import { EventEmitter } from 'fbemitter';

let _emitter: EventEmitter | null;

export function getEmitter(): EventEmitter {
  if (!_emitter) {
    _emitter = new EventEmitter();
    DeviceEventEmitter.addListener('Expo.nativeUpdatesEvent', emitEvent);
  }
  return _emitter;
}

export function emitEvent(params): void {
  let newParams = params;
  if (typeof params === 'string') {
    newParams = JSON.parse(params);
  }
  if (newParams.manifestString) {
    newParams.manifest = JSON.parse(newParams.manifestString);
    delete newParams.manifestString;
  }

  if (!_emitter) {
    throw new Error(`EventEmitter must be initialized to use from its listener`);
  }
  _emitter.emit('Expo.updatesEvent', newParams);
}
