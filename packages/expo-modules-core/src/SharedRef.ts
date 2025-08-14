'use client';

import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
import { EventsMap } from './ts-declarations/EventEmitter';
import type { ExpoGlobal } from './ts-declarations/global';

ensureNativeModulesAreInstalled();

export type SharedRef<
  TNativeRefType extends string = 'unknown',
  TEventsMap extends EventsMap = Record<never, never>,
> = typeof ExpoGlobal.SharedRef<TNativeRefType, TEventsMap>;
export const SharedRef: typeof ExpoGlobal.SharedRef = globalThis.expo.SharedRef;
