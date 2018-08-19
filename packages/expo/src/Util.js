// @flow

import invariant from 'invariant';
import { EventEmitter, EventSubscription } from 'fbemitter';
import { DeviceEventEmitter } from 'react-native';

import Localization from './Localization';
import * as Updates from './Updates';

export function getCurrentDeviceCountryAsync(): Promise<string> {
  console.warn(
    'Util.getCurrentDeviceCountryAsync is deprecated, use Localization.getCurrentDeviceCountryAsync'
  );
  return Localization.getCurrentDeviceCountryAsync();
}

export function getCurrentLocaleAsync(): Promise<string> {
  console.warn('Util.getCurrentLocaleAsync is deprecated, use Localization.getCurrentLocaleAsync');
  return Localization.getCurrentLocaleAsync();
}

export function getCurrentTimeZoneAsync(): Promise<string> {
  console.warn(
    'Util.getCurrentTimeZoneAsync is deprecated, use Localization.getCurrentTimeZoneAsync'
  );
  return Localization.getCurrentTimeZoneAsync();
}

export function reload(): void {
  console.warn('Util.reload is deprecated, use Updates.reload instead');
  return Updates.reload();
}

let _emitter: ?EventEmitter;

function _getEmitter(): EventEmitter {
  if (!_emitter) {
    _emitter = new EventEmitter();
    DeviceEventEmitter.addListener('Exponent.nativeUpdatesEvent', _emitNewVersionAvailable);
  }
  return _emitter;
}

function _emitNewVersionAvailable(newVersionEvent): void {
  if (typeof newVersionEvent === 'string') {
    newVersionEvent = JSON.parse(newVersionEvent);
  }

  // events with type === 'downloadFinished' match the events that were previously emitted
  if (newVersionEvent.type === 'downloadFinished') {
    if (newVersionEvent.manifestString && typeof newVersionEvent.manifestString === 'string') {
      newVersionEvent.manifest = JSON.parse(newVersionEvent.manifestString);
      delete newVersionEvent.manifestString;
    }
    delete newVersionEvent.type;
    invariant(_emitter, `EventEmitter must be initialized to use from its listener`);
    _emitter.emit('newVersionAvailable', newVersionEvent);
  }
}

export function addNewVersionListenerExperimental(listener: Function): EventSubscription {
  console.warn(
    'Util.addNewVersionListenerExperimental is deprecated, use Updates.addListener instead'
  );
  let emitter = _getEmitter();
  return emitter.addListener('newVersionAvailable', listener);
}
