package expo.modules.notifications.scheduling.insecurescheduler.repository;

import com.raizlabs.android.dbflow.annotation.Database;

@Database(version = ScheduledNotificationDatabase.VERSION)
public class ScheduledNotificationDatabase {
  public static final String NAME = ScheduledNotificationDatabase.class.getCanonicalName();
  public static final int VERSION = 1;
}
