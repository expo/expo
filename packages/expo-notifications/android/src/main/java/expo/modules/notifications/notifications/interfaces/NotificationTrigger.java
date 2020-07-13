package expo.modules.notifications.notifications.interfaces;

import android.os.Build;
import android.os.Parcelable;

import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;

/**
 * An interface specifying source of the notification, to be implemented
 * by concrete classes.
 */
public interface NotificationTrigger extends Parcelable {
  @Nullable
  @RequiresApi(api = Build.VERSION_CODES.O)
  default String getNotificationChannel() {
    return null;
  }
}
