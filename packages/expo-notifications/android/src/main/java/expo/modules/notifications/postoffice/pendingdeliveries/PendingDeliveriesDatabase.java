package expo.modules.notifications.postoffice.pendingdeliveries;

import com.raizlabs.android.dbflow.annotation.Database;

@Database(name = PendingDeliveriesDatabase.NAME, version = PendingDeliveriesDatabase.VERSION)
public class PendingDeliveriesDatabase {
  public static final String NAME = "ExpoNotificationPendingDeliveries";
  public static final int VERSION = 1;
}

