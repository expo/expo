'use client';

import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
import { ExpoGlobal } from './ts-declarations/global';

ensureNativeModulesAreInstalled();

export type SharedObject = typeof ExpoGlobal.SharedObject;
export const SharedObject: typeof ExpoGlobal.SharedObject = globalThis.expo.SharedObject;
