import uuid from '../uuid';
class EventEmitter {
    listeners;
    addListener(eventName, listener) {
        if (!this.listeners) {
            this.listeners = new Map();
        }
        if (!this.listeners?.has(eventName)) {
            this.listeners?.set(eventName, new Set());
        }
        const previousListenerCount = this.listenerCount(eventName);
        this.listeners?.get(eventName)?.add(listener);
        if (previousListenerCount === 0 && this.listenerCount(eventName) === 1) {
            this.startObserving(eventName);
        }
        return {
            remove: () => {
                this.removeListener(eventName, listener);
            },
        };
    }
    removeListener(eventName, listener) {
        const hasRemovedListener = this.listeners?.get(eventName)?.delete(listener);
        if (this.listenerCount(eventName) === 0 && hasRemovedListener) {
            this.stopObserving(eventName);
        }
    }
    removeAllListeners(eventName) {
        const listenerCount = this.listenerCount(eventName);
        this.listeners?.get(eventName)?.clear();
        if (listenerCount > 0) {
            this.stopObserving(eventName);
        }
    }
    emit(eventName, ...args) {
        const listeners = new Set(this.listeners?.get(eventName));
        listeners.forEach((listener) => listener(...args));
    }
    listenerCount(eventName) {
        return this.listeners?.get(eventName)?.size ?? 0;
    }
    startObserving(eventName) { }
    stopObserving(eventName) { }
}
export class NativeModule extends EventEmitter {
    ViewPrototype;
    __expo_module_name__;
}
class SharedObject extends EventEmitter {
    release() {
        throw new Error('Method not implemented.');
    }
}
globalThis.expo = {
    EventEmitter,
    NativeModule,
    SharedObject,
    modules: {},
    uuidv4: uuid.v4,
    uuidv5: uuid.v5,
    getViewConfig: () => {
        throw new Error('Method not implemented.');
    },
    reloadAppAsync: async () => {
        window.location.reload();
    },
};
//# sourceMappingURL=CoreModule.js.map