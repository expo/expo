package expo.modules.notifications.notifications.enums;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

/**
 * An enum allowing easy conversion between platform enum and native priority.
 */
public enum NotificationPriority {
  MIN(NotificationCompat.PRIORITY_MIN, "min"),
  LOW(NotificationCompat.PRIORITY_LOW, "low"),
  DEFAULT(NotificationCompat.PRIORITY_DEFAULT, "default"),
  HIGH(NotificationCompat.PRIORITY_HIGH, "high"),
  MAX(NotificationCompat.PRIORITY_MAX, "max");

  private final int mNativePriority;
  private final String mEnumValue;

  NotificationPriority(int nativePriority, String enumValue) {
    mNativePriority = nativePriority;
    mEnumValue = enumValue;
  }

  public int getNativeValue() {
    return mNativePriority;
  }

  public String getEnumValue() {
    return mEnumValue;
  }

  @Nullable
  public static NotificationPriority fromEnumValue(String value) {
    for (NotificationPriority priority : NotificationPriority.values()) {
      if (priority.getEnumValue().equalsIgnoreCase(value)) {
        return priority;
      }
    }
    return null;
  }

  @Nullable
  public static NotificationPriority fromNativeValue(int value) {
    for (NotificationPriority priority : NotificationPriority.values()) {
      if (priority.getNativeValue() == value) {
        return priority;
      }
    }
    return null;
  }
}
