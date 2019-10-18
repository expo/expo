package expo.modules.notifications.scheduling.managers;

import com.raizlabs.android.dbflow.annotation.Database;

@Database(version = SchedulersDatabase.VERSION)
public class SchedulersDatabase {
  public static final String NAME = SchedulersDatabase.class.getCanonicalName();

  public static final int VERSION = 1;
}
