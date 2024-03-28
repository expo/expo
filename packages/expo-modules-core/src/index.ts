import { DeviceEventEmitter } from 'react-native';

import { EventEmitter, Subscription } from './EventEmitter';
import NativeModule from './NativeModule';
import NativeModulesProxy from './NativeModulesProxy';
import { ProxyNativeModule } from './NativeModulesProxy.types';
import { requireNativeViewManager } from './NativeViewManagerAdapter';
import Platform from './Platform';
import SharedObject from './SharedObject';
import { CodedError } from './errors/CodedError';
import { UnavailabilityError } from './errors/UnavailabilityError';

import './sweet/setUpErrorManager.fx';
import './web/index';

export type * from './ts-declarations/global';

export { default as uuid } from './uuid';

export {
  DeviceEventEmitter,
  EventEmitter,
  NativeModulesProxy,
  ProxyNativeModule,
  Platform,
  Subscription,
  requireNativeViewManager,
  // Globals
  SharedObject,
  NativeModule,
  // Errors
  CodedError,
  UnavailabilityError,
};

export * from './requireNativeModule';
export * from './TypedArrays.types';

/**
 * @deprecated renamed to `DeviceEventEmitter`
 */
export const SyntheticPlatformEmitter = DeviceEventEmitter;

export * from './PermissionsInterface';
export * from './PermissionsHook';

export * from './Refs';

export * from './hooks/useReleasingSharedObject';
