'use client';

import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
import { EventsMap } from './ts-declarations/EventEmitter';
import type { ExpoGlobal } from './ts-declarations/global';

ensureNativeModulesAreInstalled();

/**
 * A subscription object that allows to conveniently remove an event listener from the emitter.
 */
export interface EventSubscription {
  /**
   * Removes an event listener for which the subscription has been created.
   * After calling this function, the listener will no longer receive any events from the emitter.
   */
  remove(): void;
}

export type EventEmitter<TEventsMap extends EventsMap = Record<never, never>> =
  typeof ExpoGlobal.EventEmitter<TEventsMap>;
export const EventEmitter: typeof ExpoGlobal.EventEmitter = globalThis.expo.EventEmitter;
