package expo.modules.notifications.notifications.enums;

import androidx.core.app.NotificationManagerCompat;

public enum NotificationImportance {
  /**
   * IMPORTANCE_UNSPECIFIED fails validation in com.android.server.notification.PreferencesHelper.createNotificationChannel
   * and it should not be used
   * */
  UNSPECIFIED(NotificationManagerCompat.IMPORTANCE_UNSPECIFIED, 1),
  NONE(NotificationManagerCompat.IMPORTANCE_NONE, 2),
  MIN(NotificationManagerCompat.IMPORTANCE_MIN, 3),
  LOW(NotificationManagerCompat.IMPORTANCE_LOW, 4),
  DEFAULT(NotificationManagerCompat.IMPORTANCE_DEFAULT, 5),
  HIGH(NotificationManagerCompat.IMPORTANCE_HIGH, 6),
  MAX(NotificationManagerCompat.IMPORTANCE_MAX, 7),
  UNKNOWN(NotificationManagerCompat.IMPORTANCE_DEFAULT, 0);

  private final int mNativeImportance;
  private final int mEnumValue;

  NotificationImportance(int nativeImportance, int enumValue) {
    mNativeImportance = nativeImportance;
    mEnumValue = enumValue;
  }

  public int getNativeValue() {
    return mNativeImportance;
  }

  public int getEnumValue() {
    return mEnumValue;
  }

  public static NotificationImportance fromEnumValue(int value) {
    for (NotificationImportance importance : NotificationImportance.values()) {
      if (importance.getEnumValue() == value) {
        return importance;
      }
    }
    return NotificationImportance.UNKNOWN;
  }

  public static NotificationImportance fromNativeValue(int value) {
    for (NotificationImportance importance : NotificationImportance.values()) {
      if (importance.getNativeValue() == value) {
        return importance;
      }
    }
    return NotificationImportance.UNKNOWN;
  }
}
