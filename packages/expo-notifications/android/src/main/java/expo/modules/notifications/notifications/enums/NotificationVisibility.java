package expo.modules.notifications.notifications.enums;

import android.app.Notification;

public enum NotificationVisibility {
  PUBLIC(Notification.VISIBILITY_PUBLIC, 1),
  PRIVATE(Notification.VISIBILITY_PRIVATE, 2),
  SECRET(Notification.VISIBILITY_SECRET, 3),
  UNKNOWN(Notification.VISIBILITY_PUBLIC, 0);

  private final int mNativeVisibility;
  private final int mEnumValue;

  NotificationVisibility(int nativeVisibility, int enumValue) {
    mNativeVisibility = nativeVisibility;
    mEnumValue = enumValue;
  }

  public int getNativeValue() {
    return mNativeVisibility;
  }

  public int getEnumValue() {
    return mEnumValue;
  }

  public static NotificationVisibility fromEnumValue(int value) {
    for (NotificationVisibility visibility : NotificationVisibility.values()) {
      if (visibility.getEnumValue() == value) {
        return visibility;
      }
    }
    return NotificationVisibility.UNKNOWN;
  }

  public static NotificationVisibility fromNativeValue(int value) {
    for (NotificationVisibility visibility : NotificationVisibility.values()) {
      if (visibility.getNativeValue() == value) {
        return visibility;
      }
    }
    return NotificationVisibility.UNKNOWN;
  }
}
