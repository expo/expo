'use client';

import { ensureNativeModulesAreInstalled } from './ensureNativeModulesAreInstalled';
import type { SharedObject as SharedObjectType } from './ts-declarations/SharedObject';

ensureNativeModulesAreInstalled();

const SharedObject = globalThis.expo.SharedObject as typeof SharedObjectType;

export default SharedObject;
