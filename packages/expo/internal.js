const {
  CodedError,
  createPermissionHook,
  createSnapshotFriendlyRef,
  createWebModule,
  LegacyEventEmitter,
  NativeModulesProxy,
  PermissionStatus,
  reloadAppAsync,
  UnavailabilityError,
  uuid,
} = require('expo-modules-core');

module.exports = {
  // Errors
  CodedError,
  UnavailabilityError,

  // Permissions
  createPermissionHook,
  PermissionStatus,

  // Methods
  createSnapshotFriendlyRef,
  createWebModule,

  // Utilities
  reloadAppAsync,
  uuid,

  // Legacy exports
  LegacyEventEmitter,
  NativeModulesProxy,
};
