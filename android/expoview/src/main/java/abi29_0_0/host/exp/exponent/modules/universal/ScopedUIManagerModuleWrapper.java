package abi29_0_0.host.exp.exponent.modules.universal;

import android.content.pm.PackageManager;

import abi29_0_0.com.facebook.react.bridge.ReactContext;

import abi29_0_0.expo.adapters.react.services.UIManagerModuleWrapper;
import abi29_0_0.expo.interfaces.permissions.PermissionsListener;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.expoview.Exponent;

/* package */ class ScopedUIManagerModuleWrapper extends UIManagerModuleWrapper {
  private final String mExperienceName;
  private final ExperienceId mExperienceId;

  /* package */ ScopedUIManagerModuleWrapper(ReactContext reactContext, ExperienceId experienceId, String experienceName) {
    super(reactContext);
    mExperienceId = experienceId;
    mExperienceName = experienceName;
  }

  @Override
  public boolean requestPermissions(final String[] permissions, final int requestCode, final PermissionsListener listener) {
    return Exponent.getInstance().requestPermissions(new Exponent.PermissionsListener() {
      @Override
      public void permissionsGranted() {
        listener.onPermissionResult(permissions, arrayFilled(PackageManager.PERMISSION_GRANTED, permissions.length));
      }

      @Override
      public void permissionsDenied() {
        listener.onPermissionResult(permissions, arrayFilled(PackageManager.PERMISSION_DENIED, permissions.length));
      }
    }, permissions, mExperienceId, mExperienceName);
  }

  private static int[] arrayFilled(int with, int length) {
    int[] array = new int[length];
    for (int i = 0; i < length; i++) {
      array[i] = with;
    }
    return array;
  }
}
