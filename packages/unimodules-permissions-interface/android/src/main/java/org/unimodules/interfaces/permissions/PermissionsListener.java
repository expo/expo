package org.unimodules.interfaces.permissions;

public interface PermissionsListener {
  void onPermissionResult(String[] permissions, int[] grantResults);
}
