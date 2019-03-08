import EventEmitter from 'react-native/Libraries/vendor/emitter/EventEmitter';
/**
 * Abstract base class for implementing event-emitting modules. This implements
 * a subset of the standard EventEmitter node module API.
 */
declare class NativeEventEmitter extends EventEmitter {
    _nativeModule?: any;
    constructor(nativeModule?: any);
    addListener(eventType: string, listener: (...props: any[]) => any, context?: any): any;
    removeAllListeners(eventType: string): void;
    removeSubscription(subscription: any): void;
}
export default NativeEventEmitter;
