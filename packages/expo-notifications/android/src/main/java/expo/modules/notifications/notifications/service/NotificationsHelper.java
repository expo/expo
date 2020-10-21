package expo.modules.notifications.notifications.service;

import android.content.Context;

import expo.modules.notifications.notifications.interfaces.NotificationsReconstructor;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationResponse;
import expo.modules.notifications.service.NotificationsService;

/**
 * A notification service foundation handling incoming intents
 * and delegating work to specific methods.
 */
public class NotificationsHelper {

  // Known result codes
  public static final int SUCCESS_CODE = 0;
  public static final int EXCEPTION_OCCURRED_CODE = -1;
  public static final String EXCEPTION_KEY = "exception";
  public static final String NOTIFICATIONS_KEY = "notifications";
  public static final String CATEGORIES_KEY = "categories";

  private SharedPreferencesNotificationCategoriesStore mStore;
  private Context mContext;

  public NotificationsHelper(Context context, NotificationsReconstructor notificationsReconstructor) {
    this.mContext = context.getApplicationContext();
    mStore = new SharedPreferencesNotificationCategoriesStore(context);
  }
}
