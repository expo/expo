'use client';

import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
import { EventsMap } from './ts-declarations/EventEmitter';
import type { ExpoGlobal } from './ts-declarations/global';

ensureNativeModulesAreInstalled();

export type SharedObject<TEventsMap extends EventsMap = Record<never, never>> =
  typeof ExpoGlobal.SharedObject<TEventsMap>;
export const SharedObject: typeof ExpoGlobal.SharedObject = globalThis.expo.SharedObject;
