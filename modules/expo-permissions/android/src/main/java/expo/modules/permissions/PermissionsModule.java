// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.permissions;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.support.v4.app.NotificationManagerCompat;
import android.support.v4.content.ContextCompat;

import java.util.Collections;
import java.util.List;

import expo.core.ExportedModule;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.InternalModule;
import expo.core.ModuleRegistry;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.Promise;
import expo.interfaces.permissions.Permissions;
import expo.interfaces.permissions.PermissionsListener;
import expo.interfaces.permissions.PermissionsManager;

public class PermissionsModule extends ExportedModule implements InternalModule, Permissions, ModuleRegistryConsumer {
  private static String PERMISSION_EXPIRES_NEVER = "never";
  private static final int PERMISSIONS_REQUEST = 13;

  private ModuleRegistry mModuleRegistry;

  public PermissionsModule(Context context) {
    super(context);
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @Override
  public String getName() {
    return "ExponentPermissions";
  }

  @ExpoMethod
  public void getAsync(final String type, final Promise promise) {
    Bundle result = getPermissions(type);
    if (result != null) {
      promise.resolve(result);
    } else {
      promise.reject("E_PERMISSION_UNKNOWN", String.format("Unrecognized permission %s", type));
    }
  }

  @ExpoMethod
  public void askAsync(final String type, final Promise promise) {
    Bundle existingPermissions = getPermissions(type);
    if (existingPermissions != null && existingPermissions.getString("status") != null
      && existingPermissions.getString("status").equals("granted")) {
      // if we already have permission granted, resolve immediately with that
      promise.resolve(existingPermissions);
    } else {
      switch (type) {
        case "notifications": {
          promise.resolve(getNotificationPermissions());
          break;
        }
        case "userFacingNotifications": {
          promise.resolve(getNotificationPermissions());
          break;
        }
        case "location": {
          askForLocationPermissions(promise);
          break;
        }
        case "camera": {
          askForSimplePermission(Manifest.permission.CAMERA, promise);
          break;
        }
        case "contacts": {
          askForSimplePermission(Manifest.permission.READ_CONTACTS, promise);
          break;
        }
        case "audioRecording": {
          askForSimplePermission(Manifest.permission.RECORD_AUDIO, promise);
          break;
        }
        case "systemBrightness": {
          askForWriteSettingsPermission(promise);
          break;
        }
        case "cameraRoll": {
          askForCameraRollPermissions(promise);
          break;
        }
        case "calendar": {
          askForCalendarPermissions(promise);
          break;
        }
        default:
          promise.reject("E_PERMISSION_UNSUPPORTED", String.format("Cannot request permission: %s", type));
      }
    }
  }

  private Bundle getPermissions(final String type) {
    switch (type) {
      case "notifications": {
        return getNotificationPermissions();
      }
      case "userFacingNotifications": {
        return getNotificationPermissions();
      }
      case "location": {
        return getLocationPermissions();
      }
      case "camera": {
        return getSimplePermission(android.Manifest.permission.CAMERA);
      }
      case "contacts": {
        return getSimplePermission(Manifest.permission.READ_CONTACTS);
      }
      case "audioRecording": {
        return getSimplePermission(Manifest.permission.RECORD_AUDIO);
      }
      case "systemBrightness": {
        return getWriteSettingsPermission();
      }
      case "cameraRoll": {
        return getCameraRollPermissions();
      }
      case "calendar": {
        return getCalendarPermissions();
      }
      default:
        return null;
    }
  }

  private Bundle getAlwaysGrantedPermissions() {
    Bundle response = new Bundle();
    response.putString("status", "granted");
    response.putString("expires", PERMISSION_EXPIRES_NEVER);
    return response;
  }

  private Bundle getNotificationPermissions() {
    Bundle response = new Bundle();

    boolean areEnabled = NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
    response.putString("status", areEnabled ? "granted" : "denied");

    response.putString("expires", PERMISSION_EXPIRES_NEVER);

    return response;
  }

  private Bundle getLocationPermissions() {
    Bundle response = new Bundle();
    Boolean isGranted = false;
    String scope = "none";

    int finePermission = ContextCompat.checkSelfPermission(getContext(),
      Manifest.permission.ACCESS_FINE_LOCATION);
    if (finePermission == PackageManager.PERMISSION_GRANTED) {
      response.putString("status", "granted");
      scope = "fine";
      isGranted = true;
    } else {
      int coarsePermission = ContextCompat.checkSelfPermission(getContext(),
        Manifest.permission.ACCESS_COARSE_LOCATION);
      if (coarsePermission == PackageManager.PERMISSION_GRANTED) {
        response.putString("status", "granted");
        scope = "coarse";
        isGranted = true;
      }
    }

    if (!isGranted) {
      response.putString("status", "denied");
    }
    response.putString("expires", PERMISSION_EXPIRES_NEVER);
    Bundle platformMap = new Bundle();
    platformMap.putString("scope", scope);
    response.putBundle("android", platformMap);

    return response;
  }

  // checkSelfPermission does not return accurate status of WRITE_SETTINGS
  private Bundle getWriteSettingsPermission() {
    Bundle response = new Bundle();

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      if (Settings.System.canWrite(getContext())) {
        response.putString("status", "granted");
      } else {
        response.putString("status", "denied");
      }
    } else {
      response.putString("status", "granted");
    }
    response.putString("expires", PERMISSION_EXPIRES_NEVER);

    return response;
  }

  private void askForWriteSettingsPermission(final Promise promise) {
    try {
      // Launch systems dialog for write settings
      Intent intent = new Intent(android.provider.Settings.ACTION_MANAGE_WRITE_SETTINGS);
      intent.setData(Uri.parse("package:" + getContext().getPackageName()));
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getContext().startActivity(intent);

      // Action returns nothing so we return unknown status
      // https://stackoverflow.com/questions/44389632/proper-way-to-handle-action-manage-write-settings-activity
      Bundle response = new Bundle();
      response.putString("status", "unknown");
      promise.resolve(response);
    } catch (Exception e) {
      promise.reject("Error launching write settings activity:", e.getMessage());
    }
  }

  private Bundle getSimplePermission(String permission) {
    Bundle response = new Bundle();

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      int result = ContextCompat.checkSelfPermission(getContext(), permission);
      if (result == PackageManager.PERMISSION_GRANTED) {
        response.putString("status", "granted");
      } else {
        response.putString("status", "denied");
      }
    } else {
      response.putString("status", "granted");
    }
    response.putString("expires", PERMISSION_EXPIRES_NEVER);

    return response;
  }

  private void askForSimplePermission(final String permission, final Promise promise) {
    boolean askedForPermissions = askForPermissions(new String[]{permission}, new PermissionsListener() {
      @Override
      public void onPermissionResult(String[] permissions, int[] grantResults) {
        promise.resolve(getSimplePermission(permission));
      }
    });

    if (!askedForPermissions) {
      promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "No visible activity. Must request " + permission + " when visible.");
    }
  }

  private void askForLocationPermissions(final Promise promise) {
    final String[] permissions = new String[] { Manifest.permission.ACCESS_FINE_LOCATION,
      Manifest.permission.ACCESS_COARSE_LOCATION };
    boolean askedForPermissions = askForPermissions(permissions, new PermissionsListener() {
      @Override
      public void onPermissionResult(String[] permissions, int[] grantResults) {
        promise.resolve(getLocationPermissions());
      }
    });

    if (!askedForPermissions) {
      promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "No visible activity. Must request location when visible.");
    }
  }

  private void askForCameraRollPermissions(final Promise promise) {
    final String[] permissions = new String[] { Manifest.permission.READ_EXTERNAL_STORAGE,
      Manifest.permission.WRITE_EXTERNAL_STORAGE };
    boolean askedForPermissions = askForPermissions(permissions, new PermissionsListener() {
      @Override
      public void onPermissionResult(String[] permissions, int[] grantResults) {
        promise.resolve(getCameraRollPermissions());
      }
    });

    if (!askedForPermissions) {
      promise.reject("E_ACTIVITY_DOES_NOT_EXIST",
        "No visible activity. Must request camera roll permission when visible.");
    }
  }

  private Bundle getCameraRollPermissions() {
    Bundle response = new Bundle();

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      int read = ContextCompat.checkSelfPermission(getContext(),
        Manifest.permission.READ_EXTERNAL_STORAGE);
      int write = ContextCompat.checkSelfPermission(getContext(),
        Manifest.permission.WRITE_EXTERNAL_STORAGE);
      if (read == PackageManager.PERMISSION_GRANTED && write == PackageManager.PERMISSION_GRANTED) {
        response.putString("status", "granted");
      } else {
        response.putString("status", "denied");
      }
    } else {
      response.putString("status", "granted");
    }
    response.putString("expires", PERMISSION_EXPIRES_NEVER);

    return response;
  }

  private void askForCalendarPermissions(final Promise promise) {
    final String[] permissions = new String[] { Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR };
    boolean askedForPermissions = askForPermissions(permissions, new PermissionsListener() {
      @Override
      public void onPermissionResult(String[] permissions, int[] grantResults) {
        promise.resolve(getCalendarPermissions());
      }
    });

    if (!askedForPermissions) {
      promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "No visible activity. Must request calendar when visible.");
    }
  }

  private Bundle getCalendarPermissions() {
    Bundle response = new Bundle();

    if (Build.VERSION.SDK_INT >= 23) {
      int readPermission = ContextCompat.checkSelfPermission(getContext(),
        Manifest.permission.READ_CALENDAR);
      int writePermission = ContextCompat.checkSelfPermission(getContext(),
        Manifest.permission.WRITE_CALENDAR);
      if (readPermission == PackageManager.PERMISSION_GRANTED && writePermission == PackageManager.PERMISSION_GRANTED) {
        response.putString("status", "granted");
      } else {
        response.putString("status", "denied");
      }
    } else {
      response.putString("status", "granted");
    }
    response.putString("expires", PERMISSION_EXPIRES_NEVER);

    return response;
  }

  private boolean askForPermissions(final String[] permissions, PermissionsListener listener) {
    PermissionsManager manager = mModuleRegistry.getModule(PermissionsManager.class);
    if (manager != null) {
      manager.requestPermissions(permissions, PERMISSIONS_REQUEST, listener);
      return true;
    } else {
      return false;
    }
  }

  @Override
  public int[] getPermissions(String[] permissions) {
    int[] results = new int[permissions.length];
    for (int i = 0; i < permissions.length; i++) {
      results[i] = ContextCompat.checkSelfPermission(getContext(), permissions[i]);
    }
    return results;
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) Permissions.class);
  }
}
