package expo.modules.interfaces.permissions;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import expo.modules.core.Promise;

public interface Permissions {

  static void getPermissionsWithPermissionsManager(Permissions permissionsManager, final Promise promise, String... permissions) {
    if (permissionsManager == null) {
      promise.reject("E_NO_PERMISSIONS", "Permissions module is null. Are you sure all the installed Expo modules are properly linked?");
      return;
    }
    permissionsManager.getPermissionsWithPromise(promise, permissions);
  }

  /**
   * Compatibility method that accepts expo.modules.kotlin.Promise, but forward the logic to the other method
   */
  static void getPermissionsWithPermissionsManager(
    @Nullable Permissions permissionsManager,
    @NonNull final expo.modules.kotlin.Promise promise,
    @NonNull String... permissions
  ) {
    getPermissionsWithPermissionsManager(permissionsManager, new Promise() {
      @Override public void resolve(Object value) { promise.resolve(value); }
      @Override public void reject(String c, String m, Throwable e) { promise.reject(c, m, e); }
    }, permissions);
  }

  static void askForPermissionsWithPermissionsManager(Permissions permissionsManager, final Promise promise, String... permissions) {
    if (permissionsManager == null) {
      promise.reject("E_NO_PERMISSIONS", "Permissions module is null. Are you sure all the installed Expo modules are properly linked?");
      return;
    }
    permissionsManager.askForPermissionsWithPromise(promise, permissions);
  }

  /**
   * Compatibility method that accepts expo.modules.kotlin.Promise, but forward the logic to the other method
   */
  static void askForPermissionsWithPermissionsManager(
    @Nullable Permissions permissionsManager,
    @NonNull final expo.modules.kotlin.Promise promise,
    @NonNull String... permissions
  ) {
    askForPermissionsWithPermissionsManager(permissionsManager, new Promise() {
      @Override public void resolve(Object value) { promise.resolve(value); }
      @Override public void reject(String c, String m, Throwable e) { promise.reject(c, m, e); }
    }, permissions);
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
