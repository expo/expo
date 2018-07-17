package expo.interfaces.permissions;

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
}
