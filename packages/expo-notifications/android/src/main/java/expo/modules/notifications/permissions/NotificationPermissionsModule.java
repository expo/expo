package expo.modules.notifications.permissions;

import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.os.Bundle;

import expo.modules.core.ExportedModule;
import expo.modules.core.Promise;
import expo.modules.core.arguments.ReadableArguments;
import expo.modules.core.interfaces.ExpoMethod;

import androidx.core.app.NotificationManagerCompat;

import expo.modules.interfaces.permissions.PermissionsStatus;

import static expo.modules.interfaces.permissions.PermissionsResponse.CAN_ASK_AGAIN_KEY;
import static expo.modules.interfaces.permissions.PermissionsResponse.EXPIRES_KEY;
import static expo.modules.interfaces.permissions.PermissionsResponse.GRANTED_KEY;
import static expo.modules.interfaces.permissions.PermissionsResponse.PERMISSION_EXPIRES_NEVER;
import static expo.modules.interfaces.permissions.PermissionsResponse.STATUS_KEY;

public class NotificationPermissionsModule extends ExportedModule {
  private static final String EXPORTED_NAME = "ExpoNotificationPermissionsModule";

  private static final String ANDROID_RESPONSE_KEY = "android";
  private static final String IMPORTANCE_KEY = "importance";
  private static final String INTERRUPTION_FILTER_KEY = "interruptionFilter";

  public NotificationPermissionsModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return EXPORTED_NAME;
  }

  @ExpoMethod
  public void getPermissionsAsync(final Promise promise) {
    promise.resolve(getPermissionsBundle());
  }

  @ExpoMethod
  public void requestPermissionsAsync(@SuppressWarnings("unused") final ReadableArguments permissionsTypes, final Promise promise) {
    promise.resolve(getPermissionsBundle());
  }

  private Bundle getPermissionsBundle() {
    NotificationManagerCompat managerCompat = NotificationManagerCompat.from(getContext());
    boolean areEnabled = managerCompat.areNotificationsEnabled();
    PermissionsStatus status = areEnabled ? PermissionsStatus.GRANTED : PermissionsStatus.DENIED;

    Bundle permissions = new Bundle();

    permissions.putString(EXPIRES_KEY, PERMISSION_EXPIRES_NEVER);
    permissions.putBoolean(CAN_ASK_AGAIN_KEY, areEnabled);
    permissions.putString(STATUS_KEY, status.getStatus());
    permissions.putBoolean(GRANTED_KEY, PermissionsStatus.GRANTED == status);

    Bundle platformPermissions = new Bundle();

    platformPermissions.putInt(IMPORTANCE_KEY, managerCompat.getImportance());

    NotificationManager manager = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && manager != null) {
      platformPermissions.putInt(INTERRUPTION_FILTER_KEY, manager.getCurrentInterruptionFilter());
    }

    permissions.putBundle(ANDROID_RESPONSE_KEY, platformPermissions);

    return permissions;
  }
}
