'use client';

import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
import type { EventEmitter } from './ts-declarations/EventEmitter';

ensureNativeModulesAreInstalled();

export type { EventSubscription } from './ts-declarations/EventEmitter';
export default globalThis.expo.EventEmitter as typeof EventEmitter;
