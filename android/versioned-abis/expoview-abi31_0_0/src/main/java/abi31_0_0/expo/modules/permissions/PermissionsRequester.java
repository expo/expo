package abi31_0_0.expo.modules.permissions;

import abi31_0_0.expo.core.ModuleRegistry;
import abi31_0_0.expo.interfaces.permissions.PermissionsListener;
import abi31_0_0.expo.interfaces.permissions.PermissionsManager;

public class PermissionsRequester {

  private static final int PERMISSIONS_REQUEST = 13;
  private PermissionsManager mPermissionManager;

  PermissionsRequester(ModuleRegistry moduleRegistry) {
    mPermissionManager = moduleRegistry.getModule(PermissionsManager.class);
  }

  boolean askForPermissions(final String[] permissions, PermissionsListener listener) {
    if (mPermissionManager != null) {
      mPermissionManager.requestPermissions(permissions, PERMISSIONS_REQUEST, listener);
      return true;
    } else {
      return false;
    }
  }
}
