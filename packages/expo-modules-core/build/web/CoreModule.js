import { NativeModule } from '../ts-declarations/NativeModule';
import { SharedObject } from '../ts-declarations/SharedObject';
import uuid from '../uuid';
class WebEventEmitter {
    listeners;
    constructor() {
        this.listeners = new Map();
    }
    removeListener(eventName, listener) {
        this.listeners.get(eventName)?.delete(listener);
    }
    removeAllListeners(eventName) {
        this.listeners.get(eventName)?.clear();
    }
    emit(eventName, ...args) {
        this.listeners.get(eventName)?.forEach((listener) => listener(...args));
    }
    addListener(eventName, listener) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }
        this.listeners.get(eventName)?.add(listener);
    }
}
class CoreObject {
    modules;
    EventEmitter;
    SharedObject;
    NativeModule;
    constructor() {
        this.modules = {};
        this.SharedObject = SharedObject;
        this.NativeModule = NativeModule;
        this.EventEmitter = WebEventEmitter;
    }
    getViewConfig(viewName) {
        throw new Error('Method not implemented.');
    }
    uuidv4() {
        return uuid.v4();
    }
    uuidv5(name, namespace) {
        return uuid.v5(name, namespace);
    }
}
globalThis.expo = new CoreObject();
export default CoreObject;
//# sourceMappingURL=CoreModule.js.map