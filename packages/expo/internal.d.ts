export {
  // Errors
  CodedError,
  UnavailabilityError,

  // Permissions
  createPermissionHook,
  type PermissionExpiration,
  type PermissionHookOptions,
  type PermissionResponse,
  PermissionStatus,

  // Methods
  createSnapshotFriendlyRef,
  createWebModule,

  // Utilities
  reloadAppAsync,
  uuid,

  // Typed arrays
  type TypedArray,
  type UintBasedTypedArray,
  type IntBasedTypedArray,

  // Legacy exports
  LegacyEventEmitter,
  NativeModulesProxy,
  type ProxyNativeModule,
} from 'expo-modules-core';
