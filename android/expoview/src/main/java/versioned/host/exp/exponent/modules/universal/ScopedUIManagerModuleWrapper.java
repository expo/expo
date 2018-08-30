package versioned.host.exp.exponent.modules.universal;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;

import com.facebook.react.bridge.ReactContext;

import expo.adapters.react.services.UIManagerModuleWrapper;
import expo.core.interfaces.ActivityEventListener;
import expo.interfaces.permissions.PermissionsListener;
import host.exp.exponent.ActivityResultListener;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.expoview.Exponent;

public class ScopedUIManagerModuleWrapper extends UIManagerModuleWrapper {
  private final String mExperienceName;
  private final ExperienceId mExperienceId;

  public ScopedUIManagerModuleWrapper(ReactContext reactContext, ExperienceId experienceId, String experienceName) {
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

  @Override
  public void registerActivityEventListener(final ActivityEventListener activityEventListener) {
    Exponent.getInstance().addActivityResultListener(new ActivityResultListener() {
      @Override
      public void onActivityResult(int requestCode, int resultCode, Intent data) {
        activityEventListener.onActivityResult(Exponent.getInstance().getCurrentActivity(), requestCode, resultCode, data);
      }
    });
  }

  private static int[] arrayFilled(int with, int length) {
    int[] array = new int[length];
    for (int i = 0; i < length; i++) {
      array[i] = with;
    }
    return array;
  }
}
