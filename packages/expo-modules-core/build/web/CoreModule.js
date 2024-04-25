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
        this.listeners?.get(eventName)?.add(listener);
        return {
            remove: () => {
                this.removeListener(eventName, listener);
            },
        };
    }
    removeListener(eventName, listener) {
        this.listeners?.get(eventName)?.delete(listener);
    }
    removeAllListeners(eventName) {
        this.listeners?.get(eventName)?.clear();
    }
    emit(eventName, ...args) {
        this.listeners?.get(eventName)?.forEach((listener) => listener(...args));
    }
    listenerCount(eventName) {
        return this.listeners?.get(eventName)?.size ?? 0;
    }
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