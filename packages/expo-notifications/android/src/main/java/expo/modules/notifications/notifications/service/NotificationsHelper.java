package expo.modules.notifications.notifications.service;

import android.content.Context;

import expo.modules.notifications.notifications.interfaces.NotificationsReconstructor;

/**
 * A notification service foundation handling incoming intents
 * and delegating work to specific methods.
 */
public class NotificationsHelper {

  private SharedPreferencesNotificationCategoriesStore mStore;
  private Context mContext;

  public NotificationsHelper(Context context, NotificationsReconstructor notificationsReconstructor) {
    this.mContext = context.getApplicationContext();
    mStore = new SharedPreferencesNotificationCategoriesStore(context);
  }
}
