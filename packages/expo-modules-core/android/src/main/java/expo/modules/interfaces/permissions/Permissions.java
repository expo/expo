package expo.modules.interfaces.permissions;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import expo.modules.core.Promise;

public interface Permissions {

  static void getPermissionsWithPermissionsManager(@Nullable Permissions permissionsManager, @NonNull final Promise promise, @NonNull String... permissions) {
    if (permissionsManager == null) {
      promise.reject("E_NO_PERMISSIONS", "Permissions module is null. Are you sure all the installed Expo modules are properly linked?");
      return;
    }
    permissionsManager.getPermissionsWithPromise(promise, permissions);
  }

  static void askForPermissionsWithPermissionsManager(@Nullable Permissions permissionsManager, @NonNull final Promise promise, @NonNull String... permissions) {
    if (permissionsManager == null) {
      promise.reject("E_NO_PERMISSIONS", "Permissions module is null. Are you sure all the installed Expo modules are properly linked?");
      return;
    }
    permissionsManager.askForPermissionsWithPromise(promise, permissions);
  }

  void getPermissionsWithPromise(final Promise promise, String... permissions);

  void getPermissions(final PermissionsResponseListener response, String... permissions);

  void askForPermissionsWithPromise(final Promise promise, String... permissions);

  void askForPermissions(final PermissionsResponseListener response, String... permissions);

  boolean hasGrantedPermissions(String... permissions);

  /**
   * Checks whether given permission is present in AndroidManifest or not.
   */
  boolean isPermissionPresentInManifest(String permission);

}
