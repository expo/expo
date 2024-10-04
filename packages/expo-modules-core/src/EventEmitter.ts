'use client';

import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
import type { EventEmitter, EventSubscription } from './ts-declarations/EventEmitter';

ensureNativeModulesAreInstalled();

export { type EventSubscription };
export default globalThis.expo.EventEmitter as typeof EventEmitter;
