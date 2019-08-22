package org.unimodules.interfaces.permissions;

import org.unimodules.core.Promise;

public interface Permissions {

  void getPermissionsWithPromise(final Promise promise, String... permissions);

  void getPermissions(final PermissionsResponse response, String... permissions);

  void askForPermissionsWithPromise(final Promise promise, String... permissions);

  void askForPermissions(final PermissionsResponse response, String... permissions);

  boolean hasGrantedPermissions(String... permissions);

  /**
   * Checks whether given permission is present in AndroidManifest or not.
   */
  boolean isPermissionPresentInManifest(String permission);
}
