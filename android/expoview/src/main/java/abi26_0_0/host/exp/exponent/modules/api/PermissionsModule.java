// Copyright 2015-present 650 Industries. All rights reserved.

package abi26_0_0.host.exp.exponent.modules.api;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.support.v4.app.NotificationManagerCompat;
import android.support.v4.content.ContextCompat;

import abi26_0_0.com.facebook.react.bridge.Arguments;
import abi26_0_0.com.facebook.react.bridge.Promise;
import abi26_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi26_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi26_0_0.com.facebook.react.bridge.ReactMethod;
import abi26_0_0.com.facebook.react.bridge.WritableMap;

import host.exp.expoview.Exponent;

public class PermissionsModule extends ReactContextBaseJavaModule {
  private static String PERMISSION_EXPIRES_NEVER = "never";

  public PermissionsModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ExponentPermissions";
  }

  @ReactMethod
  public void getAsync(final String type, final Promise promise) {
    WritableMap result = getPermissions(type);
    if (result != null) {
      promise.resolve(result);
    } else {
      promise.reject("E_PERMISSION_UNKNOWN", String.format("Unrecognized permission %s", type));
    }
  }

  @ReactMethod
  public void askAsync(final String type, final Promise promise) {
    WritableMap existingPermissions = getPermissions(type);
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

  private WritableMap getPermissions(final String type) {
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

  private WritableMap getAlwaysGrantedPermissions() {
    WritableMap response = Arguments.createMap();
    response.putString("status", "granted");
    response.putString("expires", PERMISSION_EXPIRES_NEVER);
    return response;
  }

  private WritableMap getNotificationPermissions() {
    WritableMap response = Arguments.createMap();

    boolean areEnabled = NotificationManagerCompat.from(getReactApplicationContext()).areNotificationsEnabled();
    response.putString("status", areEnabled ? "granted" : "denied");

    response.putString("expires", PERMISSION_EXPIRES_NEVER);

    return response;
  }

  private WritableMap getLocationPermissions() {
    WritableMap response = Arguments.createMap();
    Boolean isGranted = false;
    String scope = "none";

    int finePermission = ContextCompat.checkSelfPermission(getReactApplicationContext(),
        Manifest.permission.ACCESS_FINE_LOCATION);
    if (finePermission == PackageManager.PERMISSION_GRANTED) {
      response.putString("status", "granted");
      scope = "fine";
      isGranted = true;
    } else {
      int coarsePermission = ContextCompat.checkSelfPermission(getReactApplicationContext(),
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
    WritableMap platformMap = Arguments.createMap();
    platformMap.putString("scope", scope);
    response.putMap("android", platformMap);

    return response;
  }

  // checkSelfPermission does not return accurate status of WRITE_SETTINGS
  private WritableMap getWriteSettingsPermission() {
    WritableMap response = Arguments.createMap();

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      if (Settings.System.canWrite(getReactApplicationContext())) {
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
      intent.setData(Uri.parse("package:" + getReactApplicationContext().getPackageName()));
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      getReactApplicationContext().startActivity(intent);

      // Action returns nothing so we return unknown status
      // https://stackoverflow.com/questions/44389632/proper-way-to-handle-action-manage-write-settings-activity
      WritableMap response = Arguments.createMap();
      response.putString("status", "unknown");
      promise.resolve(response);
    } catch (Exception e) {
      promise.reject("Error launching write settings activity:", e.getMessage());
    }
  }

  private WritableMap getSimplePermission(String permission) {
    WritableMap response = Arguments.createMap();

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      int result = ContextCompat.checkSelfPermission(getReactApplicationContext(), permission);
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
    boolean gotPermissions = Exponent.getInstance().getPermissions(new Exponent.PermissionsListener() {
      @Override
      public void permissionsGranted() {
        promise.resolve(getSimplePermission(permission));
      }

      @Override
      public void permissionsDenied() {
        promise.resolve(getSimplePermission(permission));
      }
    }, new String[] { permission });

    if (!gotPermissions) {
      promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "No visible activity. Must request " + permission + " when visible.");
    }
  }

  private void askForLocationPermissions(final Promise promise) {
    final String[] permissions = new String[] { Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION };
    boolean gotPermissions = Exponent.getInstance().getPermissions(new Exponent.PermissionsListener() {
      @Override
      public void permissionsGranted() {
        promise.resolve(getLocationPermissions());
      }

      @Override
      public void permissionsDenied() {
        promise.resolve(getLocationPermissions());
      }
    }, permissions);

    if (!gotPermissions) {
      promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "No visible activity. Must request location when visible.");
    }
  }

  private void askForCameraRollPermissions(final Promise promise) {
    final String[] permissions = new String[] { Manifest.permission.READ_EXTERNAL_STORAGE,
        Manifest.permission.WRITE_EXTERNAL_STORAGE };
    boolean gotPermissions = Exponent.getInstance().getPermissions(new Exponent.PermissionsListener() {
      @Override
      public void permissionsGranted() {
        promise.resolve(getCameraRollPermissions());
      }

      @Override
      public void permissionsDenied() {
        promise.resolve(getCameraRollPermissions());
      }
    }, permissions);

    if (!gotPermissions) {
      promise.reject("E_ACTIVITY_DOES_NOT_EXIST",
          "No visible activity. Must request camera roll permission when visible.");
    }
  }

  private WritableMap getCameraRollPermissions() {
    WritableMap response = Arguments.createMap();

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      int read = ContextCompat.checkSelfPermission(getReactApplicationContext(),
          Manifest.permission.READ_EXTERNAL_STORAGE);
      int write = ContextCompat.checkSelfPermission(getReactApplicationContext(),
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
    boolean gotPermissions = Exponent.getInstance().getPermissions(new Exponent.PermissionsListener() {
      @Override
      public void permissionsGranted() {
        promise.resolve(getCalendarPermissions());
      }

      @Override
      public void permissionsDenied() {
        promise.resolve(getCalendarPermissions());
      }
    }, permissions);

    if (!gotPermissions) {
      promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "No visible activity. Must request calendar when visible.");
    }
  }

  private WritableMap getCalendarPermissions() {
    WritableMap response = Arguments.createMap();

    if (Build.VERSION.SDK_INT >= 23) {
      int readPermission = ContextCompat.checkSelfPermission(getReactApplicationContext(),
          Manifest.permission.READ_CALENDAR);
      int writePermission = ContextCompat.checkSelfPermission(getReactApplicationContext(),
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
}
