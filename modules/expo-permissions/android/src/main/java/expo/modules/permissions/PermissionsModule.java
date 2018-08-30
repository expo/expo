// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.permissions;

import android.Manifest;
import android.annotation.TargetApi;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.support.v4.app.NotificationManagerCompat;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

import expo.core.ExportedModule;
import expo.core.interfaces.ExpoMethod;
import expo.core.ModuleRegistry;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.Promise;
import expo.interfaces.permissions.Permissions;
import expo.interfaces.permissions.PermissionsListener;

public class PermissionsModule extends ExportedModule implements ModuleRegistryConsumer {
  private static final String EXPIRES_KEY = "expires";
  private static final String STATUS_KEY = "status";
  private static final String GRANTED_VALUE = "granted";
  private static final String DENIED_VALUE = "denied";
  private static final String UNDETERMINED_VALUE = "undetermined";
  private static final String ERROR_TAG = "E_PERMISSIONS";

  private static String PERMISSION_EXPIRES_NEVER = "never";
  private PermissionsRequester mPermissionsRequester;
  private Permissions mPermissions;

  public PermissionsModule(Context context) {
    super(context);
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mPermissionsRequester = new PermissionsRequester(moduleRegistry);
    mPermissions = moduleRegistry.getModule(Permissions.class);
  }

  @Override
  public String getName() {
    return "ExponentPermissions";
  }

  @ExpoMethod
  public void getAsync(final ArrayList<String> requestedPermissionsTypes, final Promise promise) {
    try {
      promise.resolve(getPermissions(requestedPermissionsTypes));
    } catch (IllegalStateException e)  {
      promise.reject(ERROR_TAG + "_UNKNOWN", e);
    }
  }

  @ExpoMethod
  public void askAsync(final ArrayList<String> requestedPermissionsTypes, final Promise promise) {
    final Set<String> requestedPermissionsTypesSet = new HashSet<>(requestedPermissionsTypes);
    try {
      Bundle existingPermissions = getPermissions(requestedPermissionsTypes);

      // iterate over existing permissions and filter out those that are already granted
      for (String elementBundleKey : existingPermissions.keySet()) {
        final Bundle elementBundle = existingPermissions.getBundle(elementBundleKey);
        if (elementBundle.getString(STATUS_KEY) != null
            && elementBundle.getString(STATUS_KEY).equals(GRANTED_VALUE)) {
          requestedPermissionsTypesSet.remove(elementBundleKey);
        }
      }

      // all permissions are granted - resolve with them
      if (requestedPermissionsTypesSet.isEmpty()) {
        promise.resolve(existingPermissions);
        return;
      }
    } catch (IllegalStateException e) {
      promise.reject(ERROR_TAG + "_UNKNOWN", e);
      return;
    }

    // proceed with asking for non-granted permissions
    final ArrayList<String> permissionsTypesToBeAsked = new ArrayList<>();
    for (final String type : requestedPermissionsTypesSet) {
      switch (type) {
        case "notifications":
        case "userFacingNotifications":
        case "reminders":
          // we do not have to ask for it
          break;
        case "location":
          permissionsTypesToBeAsked.add(Manifest.permission.ACCESS_FINE_LOCATION);
          permissionsTypesToBeAsked.add(Manifest.permission.ACCESS_COARSE_LOCATION);
          break;
        case "camera":
          permissionsTypesToBeAsked.add(Manifest.permission.CAMERA);
          break;
        case "contacts":
          permissionsTypesToBeAsked.add(Manifest.permission.READ_CONTACTS);
          break;
        case "audioRecording":
          permissionsTypesToBeAsked.add(Manifest.permission.RECORD_AUDIO);
          break;
        case "systemBrightness":
          if (requestedPermissionsTypes.size() != 1) {
            promise.reject(ERROR_TAG + "_INVALID", "Asking for Permissions.SYSTEM_BRIGHTNESS should only be done individually on Android!");
            return;
          }
          try {
            askForWriteSettingsPermission();
          } catch (Exception e) {
            promise.reject(ERROR_TAG + "_UNSUPPORTED", String.format("Error launching write settings activity: %s", e.getMessage()));
            return;
          }
          break;
        case "cameraRoll":
          permissionsTypesToBeAsked.add(Manifest.permission.READ_EXTERNAL_STORAGE);
          permissionsTypesToBeAsked.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
          break;
        case "calendar":
          permissionsTypesToBeAsked.add(Manifest.permission.READ_CALENDAR);
          permissionsTypesToBeAsked.add(Manifest.permission.WRITE_CALENDAR);
          break;
        case "SMS":
          permissionsTypesToBeAsked.add(Manifest.permission.READ_SMS);
          break;
        default:
          promise.reject(ERROR_TAG + "_UNSUPPORTED", String.format("Cannot request permission: %s", type));
          return;
      }
    }

    final boolean askedPermissions = mPermissionsRequester.askForPermissions(
        permissionsTypesToBeAsked.toArray(new String[permissionsTypesToBeAsked.size()]), // permissionsTypesToBeAsked handles empty array
        new PermissionsListener() {
          @Override
          public void onPermissionResult(String[] permissions, int[] grantResults) {
            // read actual permissions results
            promise.resolve(getPermissions(requestedPermissionsTypes));
          }
        });

    if (!askedPermissions) {
      promise.reject(ERROR_TAG + "_UNAVAILABLE", "Permissions module is null. Are you sure all the installed Expo modules are properly linked?");
    }
  }

  private Bundle getPermissions(final ArrayList<String> permissionsTypes) throws IllegalStateException {
    Bundle permissions = new Bundle();
    for (final String permissionType : permissionsTypes) {
      permissions.putBundle(permissionType, getPermission(permissionType));
    }
    return permissions;
  }

  private Bundle getPermission(final String permissionType) throws IllegalStateException {
    switch (permissionType) {
      case "notifications":
      case "userFacingNotifications":
        return getNotificationPermissions();
      case "location":
        return getLocationPermissions();
      case "camera":
        return getSimplePermission(android.Manifest.permission.CAMERA);
      case "contacts":
        return getSimplePermission(Manifest.permission.READ_CONTACTS);
      case "audioRecording":
        return getSimplePermission(Manifest.permission.RECORD_AUDIO);
      case "systemBrightness":
        return getWriteSettingsPermission();
      case "cameraRoll":
        return getCameraRollPermissions();
      case "calendar":
        return getCalendarPermissions();
      case "SMS":
        return getSimplePermission(Manifest.permission.READ_SMS);
      case "reminders":
        Bundle response = new Bundle();
        response.putString(STATUS_KEY, GRANTED_VALUE);
        response.putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER);;
        return response;
      default:
        throw new IllegalStateException(String.format("Unrecognized permission type: %s", permissionType));
    }
  }

  private Bundle getNotificationPermissions() {
    Bundle response = new Bundle();
    boolean areEnabled = NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
    response.putString(STATUS_KEY, areEnabled ? GRANTED_VALUE : DENIED_VALUE);
    response.putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER);
    return response;
  }

  private Bundle getLocationPermissions() {
    Bundle response = new Bundle();
    String scope = "none";
    try {
      if (isPermissionGranted(Manifest.permission.ACCESS_FINE_LOCATION)) {
        response.putString(STATUS_KEY, GRANTED_VALUE);
        scope = "fine";
      } else if (isPermissionGranted(Manifest.permission.ACCESS_COARSE_LOCATION)) {
        response.putString(STATUS_KEY, GRANTED_VALUE);
        scope = "coarse";
      } else {
        response.putString(STATUS_KEY, DENIED_VALUE);
      }
    } catch (IllegalStateException e) {
      response.putString(STATUS_KEY, UNDETERMINED_VALUE);
    }

    response.putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER);
    Bundle platformMap = new Bundle();
    platformMap.putString("scope", scope);
    response.putBundle("android", platformMap);

    return response;
  }

  // checkSelfPermission does not return accurate status of WRITE_SETTINGS
  private Bundle getWriteSettingsPermission() {
    Bundle response = new Bundle();
    response.putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      try {
        // TODO: Android's is throwing here:
        // Xiaomi Redmi 4A: Android 7.1.2
        // Method threw 'java.lang.AbstractMethodError' exception.
        // java.lang.AbstractMethodError: abstract method "java.lang.String android.content.Context.getOpPackageName()"
        if (Settings.System.canWrite(getContext())) {
          response.putString(STATUS_KEY, GRANTED_VALUE);
        } else {
          response.putString(STATUS_KEY, DENIED_VALUE);
        }
      } catch (AbstractMethodError error) {
        response.putString(STATUS_KEY, DENIED_VALUE);
      }
    } else {
      response.putString(STATUS_KEY, GRANTED_VALUE);
    }

    return response;
  }

  /**
   * Checks status for Android built-in permission
   * @param permission {@link Manifest.permission}
   */
  private Bundle getSimplePermission(String permission) {
    Bundle response = new Bundle();

    try {
      if (isPermissionGranted(permission)) {
        response.putString(STATUS_KEY, GRANTED_VALUE);
      } else {
        response.putString(STATUS_KEY, DENIED_VALUE);
      }
    } catch (IllegalStateException e) {
      response.putString(STATUS_KEY, UNDETERMINED_VALUE);
    }

    response.putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER);

    return response;
  }

  private Bundle getCameraRollPermissions() {
    Bundle response = new Bundle();

    try {
      if (arePermissionsGranted(new String[]{
          Manifest.permission.READ_EXTERNAL_STORAGE,
          Manifest.permission.WRITE_EXTERNAL_STORAGE })) {
        response.putString(STATUS_KEY, GRANTED_VALUE);
      } else {
        response.putString(STATUS_KEY, DENIED_VALUE);
      }
    } catch (IllegalStateException e) {
      response.putString(STATUS_KEY, UNDETERMINED_VALUE);
    }

    response.putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER);

    return response;
  }

  private Bundle getCalendarPermissions() {
    Bundle response = new Bundle();
    try {
      if (arePermissionsGranted(new String[]{
          Manifest.permission.READ_CALENDAR,
          Manifest.permission.WRITE_CALENDAR })) {
        response.putString(STATUS_KEY, GRANTED_VALUE);
      } else {
        response.putString(STATUS_KEY, DENIED_VALUE);
      }
    } catch (IllegalStateException e) {
      response.putString(STATUS_KEY, UNDETERMINED_VALUE);
    }
    response.putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER);

    return response;
  }

  /**
   * Checks whether given permission is granted or not.
   * Throws IllegalStateException there's no Permissions module present.
   */
  private boolean isPermissionGranted(final String permission) {
    if (mPermissions != null) {
      int permissionResult = mPermissions.getPermission(permission);
      return permissionResult == PackageManager.PERMISSION_GRANTED;
    } else {
      throw new IllegalStateException("No Permissions module present.");
    }
  }

  /**
   * Checks whether all given permissions are granted or not.
   * Throws IllegalStateException there's no Permissions module present.
   */
  private boolean arePermissionsGranted(final String[] permissions) {
    if (mPermissions != null) {
      int[] permissionsResults = mPermissions.getPermissions(permissions);
      if (permissions.length != permissionsResults.length) {
        return false;
      }
      for (int result : permissionsResults) {
        if (result != PackageManager.PERMISSION_GRANTED) {
          return false;
        }
      }
      return true;
    } else {
      throw new IllegalStateException("No Permissions module present.");
    }
  }

  @TargetApi(Build.VERSION_CODES.M)
  private void askForWriteSettingsPermission() throws Exception {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      return;
    }

    // Launch systems dialog for write settings
    Intent intent = new Intent(android.provider.Settings.ACTION_MANAGE_WRITE_SETTINGS);
    intent.setData(Uri.parse("package:" + getContext().getPackageName()));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    getContext().startActivity(intent);

    // TODO: we can monitor coming back to application using onResume lifecycle function like we do in other Intent driven modules (like SMS)
    // https://stackoverflow.com/questions/44389632/proper-way-to-handle-action-manage-write-settings-activity
  }
}
