'use client';

import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
import type { SharedRef as SharedRefType } from './ts-declarations/SharedRef';

ensureNativeModulesAreInstalled();

const SharedRef = globalThis.expo.SharedRef as typeof SharedRefType;

export default SharedRef;
