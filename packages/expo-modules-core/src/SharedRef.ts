'use client';

import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
import { ExpoGlobal } from './ts-declarations/global';

ensureNativeModulesAreInstalled();

export type SharedRef = typeof ExpoGlobal.SharedRef;
export const SharedRef: typeof ExpoGlobal.SharedRef = globalThis.expo.SharedRef;
