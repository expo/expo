// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent.modules.api;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;
import android.support.v4.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;

import host.exp.exponentview.Exponent;

public class PermissionsModule  extends ReactContextBaseJavaModule {
  public static String PERMISSION_EXPIRES_NEVER = "never";

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
    if (existingPermissions != null &&
        existingPermissions.getString("status") != null &&
        existingPermissions.getString("status").equals("granted")) {
      // if we already have permission granted, resolve immediately with that
      promise.resolve(existingPermissions);
    } else {
      switch (type) {
        case "remoteNotifications": {
          // nothing to ask for, always granted
          promise.resolve(getAlwaysGrantedPermissions());
          break;
        }
        case "location": {
          askForLocationPermissions(promise);
          break;
        }
        case "camera": {
          askForCameraPermissions(promise);
          break;
        }
        default:
          promise.reject("E_PERMISSION_UNSUPPORTED", String.format("Cannot request permission: %s", type));
      }
    }
  }

  private WritableMap getPermissions(final String type) {
    switch (type) {
      case "remoteNotifications": {
        // these permissions are always the same
        return getAlwaysGrantedPermissions();
      }
      case "location": {
        return getLocationPermissions();
      }
      case "camera": {
        return getCameraPermissions();
      }
      default:
        return null;
    }
  }

  private WritableMap getLocationPermissions() {
    WritableMap response = Arguments.createMap();
    Boolean isGranted = false;
    String scope = "none";

    int finePermission = ContextCompat.checkSelfPermission(getReactApplicationContext(), android.Manifest.permission.ACCESS_FINE_LOCATION);
    if (finePermission == PackageManager.PERMISSION_GRANTED) {
      response.putString("status", "granted");
      scope =  "fine";
      isGranted = true;
    } else {
      int coarsePermission = ContextCompat.checkSelfPermission(getReactApplicationContext(), android.Manifest.permission.ACCESS_COARSE_LOCATION);
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

  private WritableMap getCameraPermissions() {
    WritableMap response = Arguments.createMap();
    Boolean isGranted = false;

    if (Build.VERSION.SDK_INT >= 23) {
      int cameraPermission = ContextCompat.checkSelfPermission(getReactApplicationContext(), android.Manifest.permission.CAMERA);
      if (cameraPermission == PackageManager.PERMISSION_GRANTED) {
        response.putString("status", "granted");
      } else {
        response.putString("status", "denied");
      }
    } else {
      response.putString("status", "granted");
    }

    response.putString("expires", PERMISSION_EXPIRES_NEVER);
    WritableMap platformMap = Arguments.createMap();

    return response;
  }

  private WritableMap getAlwaysGrantedPermissions() {
    WritableMap response = Arguments.createMap();
    response.putString("status", "granted");
    response.putString("expires", PERMISSION_EXPIRES_NEVER);
    return response;
  }

  private void askForLocationPermissions(final Promise promise) {
    final String[] permissions = new String[]{
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION
    };
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

  private void askForCameraPermissions(final Promise promise) {
    Activity activity = getCurrentActivity();
    if (activity == null) {
      promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "No visible activity. Must request camera when visible.");
      return;
    }

    final String[] permissions = new String[]{
        Manifest.permission.CAMERA,
    };
    Exponent.getInstance().getPermissions(new Exponent.PermissionsListener() {
      @Override
      public void permissionsGranted() {
        promise.resolve(getCameraPermissions());
      }
      @Override
      public void permissionsDenied() {
        promise.resolve(getCameraPermissions());
      }
    }, permissions);
  }
}
