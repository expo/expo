package expo.modules.notifications.postoffice.pendingdeliveries;

import com.raizlabs.android.dbflow.annotation.Database;

@Database(version = PendingDeliveriesDatabase.VERSION)
public class PendingDeliveriesDatabase {
  public static final String NAME = PendingDeliveriesDatabase.class.getCanonicalName();
  public static final int VERSION = 1;
}

