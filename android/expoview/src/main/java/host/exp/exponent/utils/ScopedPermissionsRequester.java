package host.exp.exponent.utils;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.pm.PackageManager;
import android.os.Build;

import com.facebook.react.modules.core.PermissionListener;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.inject.Inject;

import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.experience.ReactNativeActivity;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.services.ExpoKernelServiceRegistry;
import host.exp.expoview.Exponent;
import host.exp.expoview.R;

public class ScopedPermissionsRequester {

  @Inject
  ExpoKernelServiceRegistry mExpoKernelServiceRegistry;

  public static final int EXPONENT_PERMISSIONS_REQUEST = 13;
  private PermissionListener mPermissionListener;
  private ExperienceId mExperienceId;
  private String mExperienceName;
  private Map<String, Integer> mPermissionsResult = new HashMap<>();
  private List<String> mPermissionsToRequestPerExperience = new ArrayList<>();
  private List<String> mPermissionsToRequestGlobally = new ArrayList<>();
  private int mPermissionsAskedCount = 0;

  public ScopedPermissionsRequester(ExperienceId experienceId) {
    NativeModuleDepsProvider.getInstance().inject(ScopedPermissionsRequester.class, this);
    mExperienceId = experienceId;
  }

  public void requestPermissions(ReactNativeActivity currentActivity, final String experienceName, final String[] permissions, final PermissionListener listener) {
    mPermissionListener = listener;
    mExperienceName = experienceName;
    mPermissionsResult = new HashMap<>();

    for (String permission : permissions) {
      int globalStatus = currentActivity.checkSelfPermission(permission);
      if (globalStatus == PackageManager.PERMISSION_DENIED) {
        mPermissionsToRequestGlobally.add(permission);
      } else if (mExperienceId != null &&
          !mExpoKernelServiceRegistry.getPermissionsKernelService().hasGrantedPermissions(permission, mExperienceId)) {
        mPermissionsToRequestPerExperience.add(permission);
      } else {
        mPermissionsResult.put(permission, PackageManager.PERMISSION_GRANTED);
      }
    }

    if (mPermissionsToRequestPerExperience.isEmpty() && mPermissionsToRequestGlobally.isEmpty()) {
      callPermissionsListener();
      return;
    }

    mPermissionsAskedCount = mPermissionsToRequestPerExperience.size();

    if (!mPermissionsToRequestPerExperience.isEmpty()) {
      requestExperienceAndGlobalPermissions(mPermissionsToRequestPerExperience.get(mPermissionsAskedCount - 1));
    } else if (!mPermissionsToRequestGlobally.isEmpty()) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        currentActivity.requestPermissions(mPermissionsToRequestGlobally.toArray(new String[0]),
          EXPONENT_PERMISSIONS_REQUEST);
      } else {
        int[] result = new int[mPermissionsToRequestGlobally.size()];
        Arrays.fill(result, PackageManager.PERMISSION_DENIED);
        onRequestPermissionsResult(mPermissionsToRequestGlobally.toArray(new String[0]), result);
      }
    }
  }

  public void onRequestPermissionsResult(final String[] permissions, final int[] grantResults) {
    if (mPermissionListener == null) {
      // sometimes onRequestPermissionsResult is called multiple times if the first permission
      // is rejected...
      return;
    }

    if (grantResults.length > 0) {
      for (int i = 0; i < grantResults.length; i++) {
        if (grantResults[i] == PackageManager.PERMISSION_GRANTED && mExperienceId != null) {
          mExpoKernelServiceRegistry.getPermissionsKernelService().grantScopedPermissions(permissions[i], mExperienceId);
        }
        mPermissionsResult.put(permissions[i], grantResults[i]);
      }
    }

    callPermissionsListener();
  }

  private void callPermissionsListener() {
    String[] permissions = mPermissionsResult.keySet().toArray(new String[0]);
    int[] result = new int[permissions.length];
    for (int i = 0; i < permissions.length; i++) {
      result[i] = mPermissionsResult.get(permissions[i]);
    }
    mPermissionListener.onRequestPermissionsResult(EXPONENT_PERMISSIONS_REQUEST, permissions, result);
  }

  private void requestExperienceAndGlobalPermissions(String permission) {
    Activity activity = Exponent.getInstance().getCurrentActivity();

    AlertDialog.Builder builder = new AlertDialog.Builder(activity);
    ScopedPermissionsRequester.PermissionsDialogOnClickListener onClickListener = new ScopedPermissionsRequester.PermissionsDialogOnClickListener(permission);
    builder.setMessage(activity.getString(
        R.string.experience_needs_permissions,
        mExperienceName,
        activity.getString(permissionToResId(permission))))
        .setPositiveButton(R.string.allow_experience_permissions, onClickListener)
        .setNegativeButton(R.string.deny_experience_permissions, onClickListener).show();

  }

  private int permissionToResId(String permission) {
    switch (permission) {
      case android.Manifest.permission.CAMERA:
        return R.string.perm_camera;
      case android.Manifest.permission.READ_CONTACTS:
        return R.string.perm_contacts_read;
      case android.Manifest.permission.WRITE_CONTACTS:
        return R.string.perm_contacts_write;
      case android.Manifest.permission.READ_EXTERNAL_STORAGE:
        return R.string.perm_camera_roll_read;
      case android.Manifest.permission.WRITE_EXTERNAL_STORAGE:
        return R.string.perm_camera_roll_write;
      case android.Manifest.permission.RECORD_AUDIO:
        return R.string.perm_audio_recording;
      case android.provider.Settings.ACTION_MANAGE_WRITE_SETTINGS:
        return R.string.perm_system_brightness;
      case android.Manifest.permission.READ_CALENDAR:
        return R.string.perm_calendar_read;
      case android.Manifest.permission.WRITE_CALENDAR:
        return R.string.perm_calendar_write;
      case android.Manifest.permission.ACCESS_FINE_LOCATION:
        return R.string.perm_fine_location;
      case android.Manifest.permission.ACCESS_COARSE_LOCATION:
        return R.string.perm_coarse_location;
      default:
        return -1;
    }
  }

  private class PermissionsDialogOnClickListener implements DialogInterface.OnClickListener {

    private String mPermission;

    PermissionsDialogOnClickListener(String permission) {
      mPermission = permission;
    }

    @Override
    public void onClick(DialogInterface dialog, int which) {
      mPermissionsAskedCount -= 1;
      switch (which) {
        case DialogInterface.BUTTON_POSITIVE:
          mExpoKernelServiceRegistry.getPermissionsKernelService().grantScopedPermissions(mPermission, mExperienceId);
          mPermissionsResult.put(mPermission, PackageManager.PERMISSION_GRANTED);
          break;

        case DialogInterface.BUTTON_NEGATIVE:
          mExpoKernelServiceRegistry.getPermissionsKernelService().revokeScopedPermissions(mPermission, mExperienceId);
          mPermissionsResult.put(mPermission, PackageManager.PERMISSION_DENIED);
          break;
      }

      if (mPermissionsAskedCount > 0) {
        requestExperienceAndGlobalPermissions(mPermissionsToRequestPerExperience.get(mPermissionsAskedCount - 1));
      } else if (!mPermissionsToRequestGlobally.isEmpty() && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        Exponent.getInstance().getCurrentActivity()
            .requestPermissions(mPermissionsToRequestGlobally.toArray(new String[0]),
                EXPONENT_PERMISSIONS_REQUEST);
      } else {
        callPermissionsListener();
      }
    }
  }

}
