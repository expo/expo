import { EventEmitter, EventSubscription } from 'fbemitter';
import { DeviceEventEmitter } from 'react-native';

import * as Updates from './Updates';

export function reload(): void {
  console.warn('Util.reload is deprecated and will be removed in SDK 31, use Updates.reload instead');
  return Updates.reload();
}

let _emitter: EventEmitter | null;

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

    if (!_emitter) {
      throw new Error(`EventEmitter must be initialized to use from its listener`);
    }
    _emitter.emit('newVersionAvailable', newVersionEvent);
  }
}

export function addNewVersionListenerExperimental(listener: Function): EventSubscription {
  console.warn(
    'Util.addNewVersionListenerExperimental is deprecated and will be removed in SDK 31, use Updates.addListener instead'
  );
  let emitter = _getEmitter();
  return emitter.addListener('newVersionAvailable', listener);
}
