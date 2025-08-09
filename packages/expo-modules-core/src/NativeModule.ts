'use client';

import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
import { ExpoGlobal } from './ts-declarations/global';

ensureNativeModulesAreInstalled();

export type NativeModule = typeof ExpoGlobal.NativeModule;
export const NativeModule: typeof ExpoGlobal.NativeModule = globalThis.expo.NativeModule;
