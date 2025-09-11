import { installGlobal as install } from 'expo/internal/install-global';
import { Storage as KVStorage } from './Storage';
class Storage {
    storage;
    constructor(storage) {
        this.storage = storage;
    }
    clear() {
        this.storage.clearSync();
    }
    getItem(key) {
        return this.storage.getItemSync(key);
    }
    key(index) {
        return this.storage.getKeyByIndexSync(index);
    }
    removeItem(key) {
        this.storage.removeItemSync(key);
    }
    setItem(key, value) {
        this.storage.setItemSync(key, String(value));
    }
    get length() {
        return this.storage.getLengthSync();
    }
    toString() {
        return '[object Storage]';
    }
}
/**
 * A Proxy wrapper that allows property accessors to be used on the `WebStorageWrapper` object.
 */
function withPropertyAccessors(obj) {
    if (typeof Proxy !== 'function') {
        return obj;
    }
    const builtin = new Set();
    let proto = obj;
    while (proto) {
        Object.getOwnPropertyNames(proto).forEach((name) => builtin.add(name));
        proto = Object.getPrototypeOf(proto);
    }
    return new Proxy(obj, {
        get(target, prop, receiver) {
            if (typeof prop !== 'string' || builtin.has(prop)) {
                return Reflect.get(target, prop, receiver);
            }
            // Values are always converted to strings so getItem returns null only when there is no value
            const value = target.getItem(prop);
            return value === null ? undefined : value;
        },
        set(target, prop, value, receiver) {
            if (typeof prop !== 'string' || builtin.has(prop)) {
                return Reflect.set(target, prop, value, receiver);
            }
            target.setItem(prop, String(value));
            return true;
        },
        deleteProperty(target, prop) {
            if (typeof prop !== 'string' || Reflect.ownKeys(target).includes(prop)) {
                return Reflect.deleteProperty(target, prop);
            }
            target.removeItem(prop);
            return true;
        },
        has(target, prop) {
            if (typeof prop !== 'string' || builtin.has(prop)) {
                return Reflect.has(target, prop);
            }
            return target.getItem(prop) !== null;
        },
    });
}
/**
 * The default instance of the [`SQLiteStorage`](#sqlitestorage-1) class is used as a drop-in implementation for the [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) object from the Web.
 */
export const localStorage = withPropertyAccessors(new Storage(KVStorage));
/**
 * Install the `localStorage` on the `globalThis` object.
 */
export function installGlobal() {
    install('localStorage', () => localStorage);
}
//# sourceMappingURL=WebStorage.js.map