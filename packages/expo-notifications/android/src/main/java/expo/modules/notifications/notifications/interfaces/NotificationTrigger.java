package expo.modules.notifications.notifications.interfaces;

import android.annotation.TargetApi;
import android.os.Build;
import android.os.Parcelable;

import androidx.annotation.Nullable;

/**
 * An interface specifying source of the notification, to be implemented
 * by concrete classes.
 */
public interface NotificationTrigger extends Parcelable {
  @Nullable
  @TargetApi(Build.VERSION_CODES.O)
  default String getNotificationChannel() {
    return null;
  }
}
