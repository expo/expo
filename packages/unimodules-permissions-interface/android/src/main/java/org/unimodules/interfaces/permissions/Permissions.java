package org.unimodules.interfaces.permissions;

public interface Permissions {
  /**
   * @param permissions {String[]} of {@link android.Manifest.permission}
   * @return {int[]} of either {@link android.content.pm.PackageManager#PERMISSION_GRANTED} if you have the
   * permission, or {@link android.content.pm.PackageManager#PERMISSION_DENIED} if not.
   */
  int[] getPermissions(String[] permissions);

  /**
   * @param permission {@link android.Manifest.permission}
   * @return {@link android.content.pm.PackageManager#PERMISSION_GRANTED} if you have the
   * permission, or {@link android.content.pm.PackageManager#PERMISSION_DENIED} if not.
   */
  int getPermission(String permission);

  /**
   * @param permissions {String[]} of {@link android.Manifest.permission}
   * @param listener {@link PermissionsRequestListener} that would be called when permissions action ends
   */
  void askForPermissions(String[] permissions, PermissionsRequestListener listener);

  /**
   * @param permission {String[]} of {@link android.Manifest.permission}
   * @param listener {@link PermissionRequestListener}
   */
  void askForPermission(String permission, PermissionRequestListener listener);

  /**
   * @param permissions {String[]} of {@link android.Manifest.permission}
   * @return {boolean} whether all given permissions are granted.
   */
  boolean hasPermissions(String[] permissions);

  interface PermissionRequestListener {
    /**
     * @param result {@link android.content.pm.PackageManager#PERMISSION_GRANTED} if you have the
     * permission, or {@link android.content.pm.PackageManager#PERMISSION_DENIED} if not.
     */
    void onPermissionResult(int result);
  }

  interface PermissionsRequestListener {
    /**
     * @param results {int[]} of either {@link android.content.pm.PackageManager#PERMISSION_GRANTED} if you have the
     * permission, or {@link android.content.pm.PackageManager#PERMISSION_DENIED} if not.
     */
    void onPermissionsResult(int[] results);
  }
}
