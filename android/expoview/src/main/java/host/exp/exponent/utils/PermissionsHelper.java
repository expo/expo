/*
  We need this class to ensure back compatibility.
  It's only used in Exponent class.
 */
package host.exp.exponent.utils;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.content.ContextCompat;

import java.util.ArrayList;
import java.util.List;

import javax.inject.Inject;

import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.kernel.services.ExpoKernelServiceRegistry;
import host.exp.expoview.Exponent;
import host.exp.expoview.R;

// TODO: remove once SDK 35 is deprecated
public class PermissionsHelper {

  @Inject
  ExpoKernelServiceRegistry mExpoKernelServiceRegistry;

  private static final int EXPONENT_PERMISSIONS_REQUEST = 13;
  private Exponent.PermissionsListener mPermissionsListener;
  private ExperienceId mExperienceId;
  private String mExperienceName;

  private boolean mExperiencePermissionsGranted = true;
  private List<String> mPermissionsToRequestGlobally = new ArrayList<>();
  private List<String> mPermissionsToRequestPerExperience = new ArrayList<>();
  private int mPermissionsAskedCount = 0;

  public PermissionsHelper(ExperienceId experienceId) {
    NativeModuleDepsProvider.getInstance().inject(PermissionsHelper.class, this);
    mExperienceId = experienceId;
  }

  public boolean getPermissions(String permissions) {
    Activity activity = Exponent.getInstance().getCurrentActivity();
    return (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || ContextCompat.checkSelfPermission(activity, permissions) == PackageManager.PERMISSION_GRANTED) &&
        mExpoKernelServiceRegistry.getPermissionsKernelService().hasGrantedPermissions(permissions, mExperienceId);
  }

  public boolean requestPermissions(Exponent.PermissionsListener listener, String[] permissions,
                                    String experienceName) {
    Activity activity = Exponent.getInstance().getCurrentActivity();
    if (activity == null) {
      return false;
    }

    boolean isGranted = true;
    mExperienceName = experienceName;
    List<String> permissionsToExplain = new ArrayList<>();
    for (String permission : permissions) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
          /* check for global permission */ activity.checkSelfPermission(permission) != PackageManager.PERMISSION_GRANTED) {
        isGranted = false;
        mPermissionsToRequestGlobally.add(permission);

        if (activity.shouldShowRequestPermissionRationale(permission)) {
          permissionsToExplain.add(permission);
        }
      } else if (mExperienceId != null &&
          !mExpoKernelServiceRegistry.getPermissionsKernelService().hasGrantedPermissions(permission, mExperienceId)) {
        isGranted = false;
        mPermissionsToRequestPerExperience.add(permission);
      }
    }

    if (isGranted) {
      listener.permissionsGranted();
      return true;
    }

    // TODO: explain why this experience needs permissionsToExplain

    mPermissionsAskedCount = mPermissionsToRequestPerExperience.size();
    mPermissionsListener = listener;

    if (!mPermissionsToRequestPerExperience.isEmpty()) {
      showPermissionsDialogForExperience(mPermissionsToRequestPerExperience.get(mPermissionsAskedCount - 1));
    } else if (!mPermissionsToRequestGlobally.isEmpty() && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      activity.requestPermissions(mPermissionsToRequestGlobally.toArray(new String[mPermissionsToRequestGlobally.size()]),
          EXPONENT_PERMISSIONS_REQUEST);
    }

    return true;
  }

  public void onRequestPermissionsResult(int requestCode, String permissions[], int[] grantResults) {
    if (requestCode == EXPONENT_PERMISSIONS_REQUEST) {
      if (mPermissionsListener == null) {
        // sometimes onRequestPermissionsResult is called multiple times if the first permission
        // is rejected...
        return;
      }

      boolean isGranted = false;
      if (grantResults.length > 0) {
        isGranted = true;
        for (int i = 0; i < grantResults.length; i++) {
          int result = grantResults[i];
          if (result != PackageManager.PERMISSION_GRANTED) {
            isGranted = false;
            break;
          } else if (mExperienceId != null) {
            mExpoKernelServiceRegistry.getPermissionsKernelService().grantScopedPermissions(permissions[i], mExperienceId);
          }
        }
      }

      if (isGranted && mExperiencePermissionsGranted) {
        mPermissionsListener.permissionsGranted();
      } else {
        mPermissionsListener.permissionsDenied();
      }
      mPermissionsListener = null;
    } else {
      if (Build.VERSION.SDK_INT > Build.VERSION_CODES.M) {
        Exponent.getInstance().getCurrentActivity()
            .onRequestPermissionsResult(requestCode, permissions, grantResults);
      }
    }
  }

  private void showPermissionsDialogForExperience(String permission) {
    Activity activity = Exponent.getInstance().getCurrentActivity();

    AlertDialog.Builder builder = new AlertDialog.Builder(activity);
    PermissionsDialogOnClickListener onClickListener = new PermissionsDialogOnClickListener(permission);
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
          break;

        case DialogInterface.BUTTON_NEGATIVE:
          mExpoKernelServiceRegistry.getPermissionsKernelService().revokeScopedPermissions(mPermission, mExperienceId);
          mExperiencePermissionsGranted = false;
          break;
      }

      if (mPermissionsAskedCount > 0) {
        showPermissionsDialogForExperience(mPermissionsToRequestPerExperience.get(mPermissionsAskedCount - 1));
        // hello compiler - second part of 'if' is necessary
      } else if (!mPermissionsToRequestGlobally.isEmpty() && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        Exponent.getInstance().getCurrentActivity()
            .requestPermissions(mPermissionsToRequestGlobally.toArray(new String[mPermissionsToRequestGlobally.size()]),
                EXPONENT_PERMISSIONS_REQUEST);
      } else if (mExperiencePermissionsGranted) {
        mPermissionsListener.permissionsGranted();
      } else {
        mPermissionsListener.permissionsDenied();
      }
    }
  }

}
