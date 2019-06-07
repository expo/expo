package expo.modules.notifications.action;

import com.raizlabs.android.dbflow.annotation.Database;

@Database(name = ActionDatabase.NAME, version = ActionDatabase.VERSION)
public class ActionDatabase {
  public static final String NAME = "ExpoNotificationActions";
  public static final int VERSION = 1;
}
