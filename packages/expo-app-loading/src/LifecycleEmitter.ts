import { EventEmitter } from 'fbemitter';

let _lifecycleEmitter: EventEmitter | null = null;

export function _emitEvent(event: string): void {
  if (_lifecycleEmitter) {
    _lifecycleEmitter.emit(event);
  }
}

export function getAppLoadingLifecycleEmitter(): EventEmitter {
  if (!_lifecycleEmitter) {
    _lifecycleEmitter = new EventEmitter();
  }
  return _lifecycleEmitter;
}
