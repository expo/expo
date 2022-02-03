// Expose this file as a module (see https://stackoverflow.com/a/59499895/4337317)
export {};

/**
 * Handle deprecations and missing typings that not available in the main lib.dom.d.ts file.
 */
declare global {
  type GetUserMediaFunctionType = (
    constraints: MediaStreamConstraints,
    successCallback: () => MediaStream,
    failureCallback: () => DOMException
  ) => undefined;
  interface Navigator {
    /**
     * This method has been deprecated: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getUserMedia
     * TODO: migrate to https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
     */
    getUserMedia?: GetUserMediaFunctionType;
    webkitGetUserMedia?: GetUserMediaFunctionType;
    mozGetUserMedia?: GetUserMediaFunctionType;
  }

  type PermissionNameWithAdditionalValues = PermissionName | 'camera';

  // TODO: remove once "microphone" name is added to the PermissionName union type exposed by the main lib.dom.d.ts file.
  interface Permissions {
    // Replace original PermissionDescriptor with our own that includes missing permission names (e.g. "microphone")
    query(permissionDesc: PermissionDescriptorWithAdditionalValues): Promise<PermissionStatus>;
  }

  interface PermissionDescriptorWithAdditionalValues {
    name: PermissionNameWithAdditionalValues;
  }
}
