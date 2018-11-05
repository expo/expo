package expo.interfaces.permissions;

public interface PermissionsManager {
  boolean requestPermissions(String[] permissions, int requestCode, PermissionsListener listener);
}
