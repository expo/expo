import { EventEmitter } from 'fbemitter';
let _lifecycleEmitter = null;
export function _emitEvent(event) {
    if (_lifecycleEmitter) {
        _lifecycleEmitter.emit(event);
    }
}
export function getAppLoadingLifecycleEmitter() {
    if (!_lifecycleEmitter) {
        _lifecycleEmitter = new EventEmitter();
    }
    return _lifecycleEmitter;
}
//# sourceMappingURL=LifecycleEmitter.js.map