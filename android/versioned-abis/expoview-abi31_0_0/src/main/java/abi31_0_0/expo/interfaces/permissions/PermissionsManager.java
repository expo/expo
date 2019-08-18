package abi31_0_0.expo.interfaces.permissions;

public interface PermissionsManager {
  boolean requestPermissions(String[] permissions, int requestCode, PermissionsListener listener);
}
