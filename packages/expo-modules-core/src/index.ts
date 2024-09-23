import EventEmitter, { type EventSubscription } from './EventEmitter';
import { LegacyEventEmitter } from './LegacyEventEmitter';
import NativeModule from './NativeModule';
import NativeModulesProxy from './NativeModulesProxy';
import { ProxyNativeModule } from './NativeModulesProxy.types';
import { requireNativeViewManager } from './NativeViewManagerAdapter';
import Platform from './Platform';
import SharedObject from './SharedObject';
import SharedRef from './SharedRef';
import { CodedError } from './errors/CodedError';
import { UnavailabilityError } from './errors/UnavailabilityError';

import './sweet/setUpErrorManager.fx';
import './web/index';

export type * from './ts-declarations/global';

export { default as uuid } from './uuid';

export {
  ProxyNativeModule,
  Platform,
  requireNativeViewManager,
  // Globals
  EventEmitter,
  SharedObject,
  SharedRef,
  NativeModule,
  // Errors
  CodedError,
  UnavailabilityError,
  // Types
  EventSubscription,
  // Deprecated
  NativeModulesProxy,
  LegacyEventEmitter,
};

export * from './requireNativeModule';
export * from './registerWebModule';
export * from './TypedArrays.types';

export * from './PermissionsInterface';
export * from './PermissionsHook';

export * from './Refs';

export * from './hooks/useReleasingSharedObject';
export * from './reload';
