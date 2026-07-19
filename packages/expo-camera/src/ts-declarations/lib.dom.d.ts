// Expose this file as a module (see https://stackoverflow.com/a/59499895/4337317)
export {};

/**
 * Handle missing typings that are not available in the main lib.dom.d.ts file.
 */
declare global {
  type PermissionNameWithAdditionalValues = PermissionName | 'camera' | 'microphone';

  // TODO: remove once "microphone" name is added to the PermissionName union type exposed by the main lib.dom.d.ts file.
  interface Permissions {
    // Replace original PermissionDescriptor with our own that includes missing permission names (e.g. "microphone")
    query(permissionDesc: PermissionDescriptorWithAdditionalValues): Promise<PermissionStatus>;
  }

  interface PermissionDescriptorWithAdditionalValues {
    name: PermissionNameWithAdditionalValues;
  }
}
