package expo.modules.notifications.action;

import com.raizlabs.android.dbflow.annotation.Database;

@Database(version = ActionDatabase.VERSION)
public class ActionDatabase {
  public static final String NAME = ActionDatabase.class.getCanonicalName();
  public static final int VERSION = 1;
}
