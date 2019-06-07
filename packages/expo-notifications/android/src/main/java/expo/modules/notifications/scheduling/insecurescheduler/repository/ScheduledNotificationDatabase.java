package expo.modules.notifications.scheduling.insecurescheduler.repository;

import com.raizlabs.android.dbflow.annotation.Database;

@Database(name = ScheduledNotificationDatabase.NAME, version = ScheduledNotificationDatabase.VERSION)
class ScheduledNotificationDatabase {
  public static final String NAME = "ExpoScheduledNotifications";
  public static final int VERSION = 1;
}
