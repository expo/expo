/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import RCTDeviceEventEmitter from './RCTDeviceEventEmitter';

/**
 * `NativeEventEmitter` is intended for use by Native Modules to emit events to
 * JavaScript listeners. If a `NativeModule` is supplied to the constructor, it
 * will be notified (via `addListener` and `removeListeners`) when the listener
 * count changes to manage "native memory".
 *
 * Currently, all native events are fired via a global `RCTDeviceEventEmitter`.
 * This means event names must be globally unique, and it means that call sites
 * can theoretically listen to `RCTDeviceEventEmitter` (although discouraged).
 */
export default class NativeEventEmitter<TEventToArgsMap extends Record<string, any[]>> {
  addListener<TEvent extends keyof TEventToArgsMap>(
    eventType: TEvent,
    listener: (...args: TEventToArgsMap[TEvent]) => any,
    context?: any
  ): { remove(): void } {
    let subscription: any = RCTDeviceEventEmitter.addListener(eventType, listener, context);

    return {
      remove() {
        subscription?.remove?.();
        subscription = undefined;
      },
    };
  }

  emit<TEvent extends keyof TEventToArgsMap>(
    eventType: TEvent,
    ...args: TEventToArgsMap[TEvent]
  ): void {
    // Generally, `RCTDeviceEventEmitter` is directly invoked. But this is
    // included for completeness.
    RCTDeviceEventEmitter.emit(eventType, ...args);
  }

  removeAllListeners<TEvent extends keyof TEventToArgsMap>(eventType?: TEvent | null): void {
    if (eventType == null) {
      throw new Error('`NativeEventEmitter.removeAllListener()` requires a non-null argument.');
    }
    RCTDeviceEventEmitter.removeAllListeners(eventType);
  }

  listenerCount<TEvent extends keyof TEventToArgsMap>(eventType: TEvent): number {
    return RCTDeviceEventEmitter.listenerCount(eventType);
  }
}
