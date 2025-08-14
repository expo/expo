'use client';

import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
import type { EventsMap } from './ts-declarations/EventEmitter';
import type { ExpoGlobal } from './ts-declarations/global';

ensureNativeModulesAreInstalled();

export type NativeModule<TEventsMap extends EventsMap = Record<never, never>> =
  typeof ExpoGlobal.NativeModule<EventsMap>;
export const NativeModule: typeof ExpoGlobal.NativeModule = globalThis.expo.NativeModule;
