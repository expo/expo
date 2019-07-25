package abi34_0_0.org.unimodules.interfaces.permissions;

public interface PermissionsListener {
  void onPermissionResult(String[] permissions, int[] grantResults);
}
