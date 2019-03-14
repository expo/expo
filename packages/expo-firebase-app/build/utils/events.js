import { NativeModulesProxy, EventEmitter } from '@unimodules/core';
import SharedEventEmitter from './SharedEventEmitter';
const NATIVE_EMITTERS = {};
const NATIVE_SUBSCRIPTIONS = {};
export const getAppEventName = (module, eventName) => `${module.app.name}-${eventName}`;
const getNativeEmitter = (moduleName, module) => {
    const name = getAppEventName(module, moduleName);
    const nativeModule = NativeModulesProxy[moduleName];
    if (!NATIVE_EMITTERS[name]) {
        NATIVE_EMITTERS[name] = new EventEmitter(nativeModule);
    }
    return NATIVE_EMITTERS[name];
};
/**
 * Subscribe to a native event for js side distribution by appName
 *    React Native events are hard set at compile - cant do dynamic event names
 *    so we use a single event send it to js and js then internally can prefix it
 *    and distribute dynamically.
 *
 * @param module
 * @param eventName
 * @private
 */
const subscribeToNativeModuleEvents = (moduleName, module, eventName) => {
    if (!NATIVE_SUBSCRIPTIONS[eventName]) {
        const nativeEmitter = getNativeEmitter(moduleName, module);
        nativeEmitter.addListener(eventName, (event) => {
            if (event.appName) {
                // native event has an appName property - auto prefix and internally emit
                SharedEventEmitter.emit(`${event.appName}-${eventName}`, event);
            }
            else {
                // standard event - no need to prefix
                SharedEventEmitter.emit(eventName, event);
            }
        });
        NATIVE_SUBSCRIPTIONS[eventName] = true;
    }
};
export const initialiseNativeModuleEventEmitter = (module, config) => {
    const { events, moduleName } = config;
    if (events && events.length) {
        for (let i = 0, len = events.length; i < len; i++) {
            subscribeToNativeModuleEvents(moduleName, module, events[i]);
        }
    }
};
//# sourceMappingURL=events.js.map