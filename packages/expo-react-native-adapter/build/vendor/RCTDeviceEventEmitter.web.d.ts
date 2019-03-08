/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import EventSubscriptionVendor from 'react-native/Libraries/vendor/emitter/EventSubscriptionVendor';
import EventEmitter from 'react-native/Libraries/vendor/emitter/EventEmitter';
/**
 * Deprecated - subclass NativeEventEmitter to create granular event modules instead of
 * adding all event listeners directly to RCTDeviceEventEmitter.
 */
declare class RCTDeviceEventEmitter extends EventEmitter {
    sharedSubscriber: EventSubscriptionVendor;
    constructor();
    addListener(eventType: string, listener: any, context?: any): any;
    removeAllListeners(eventType?: string): void;
    removeSubscription(subscription: any): void;
}
declare const _default: RCTDeviceEventEmitter;
export default _default;
