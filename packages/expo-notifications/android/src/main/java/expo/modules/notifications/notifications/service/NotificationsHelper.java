package expo.modules.notifications.notifications.service;

import android.content.Context;
import android.os.ResultReceiver;
import android.util.Log;

import java.io.IOException;
import java.util.Collection;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.interfaces.NotificationsReconstructor;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationBehavior;
import expo.modules.notifications.notifications.model.NotificationCategory;
import expo.modules.notifications.notifications.model.NotificationResponse;
import expo.modules.notifications.service.NotificationsService;

/**
 * A notification service foundation handling incoming intents
 * and delegating work to specific methods.
 */
public class NotificationsHelper {

  // Known result codes
  public static final int SUCCESS_CODE = 0;
  @SuppressWarnings("unused")
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

  /**
   * A function returning all presented notifications to receiver
   *
   * @param receiver A receiver to which send the notifications
   */
  public void getAllPresented(@Nullable ResultReceiver receiver) {
    NotificationsService.Companion.enqueueGetAllPresented(mContext, receiver);
  }

  /**
   * A helper function for presenting a notification
   *
   * @param notification Notification to present
   * @param behavior     Allowed notification behavior
   * @param receiver     A receiver to which send the result of presenting the notification
   */
  public void presentNotification(@NonNull Notification notification, @Nullable NotificationBehavior behavior, @Nullable ResultReceiver receiver) {
    NotificationsService.Companion.enqueuePresent(mContext, notification, behavior, receiver);
  }

  /**
   * A helper function for handling received notification
   *
   * @param notification Notification received
   */
  public void notificationReceived(Notification notification) {
    notificationReceived(notification, null);
  }

  /**
   * A helper function for handling received notification
   *
   * @param notification Notification received
   * @param receiver     Result receiver
   */
  public void notificationReceived(Notification notification, ResultReceiver receiver) {
    NotificationsService.Companion.enqueueReceive(mContext, notification, receiver);
  }

  /**
   * A helper function for dismissing notification.
   *
   * @param identifier Notification identifier
   */
  public void dismiss(@NonNull String identifier, @Nullable ResultReceiver receiver) {
    NotificationsService.Companion.enqueueDismiss(mContext, new String[]{identifier}, receiver);
  }

  /**
   * A helper function for dismissing multiple notifications
   *
   * @param identifiers Notification identifiers
   */
  public void enqueueDismissSelected(@NonNull String[] identifiers, @Nullable ResultReceiver receiver) {
    NotificationsService.Companion.enqueueDismiss(mContext, identifiers, receiver);
  }

  /**
   * A helper function for dispatching all notification
   */
  public void dismissAll(@Nullable ResultReceiver receiver) {
    NotificationsService.Companion.enqueueDismissAll(mContext, receiver);
  }

  /**
   * A helper function for dispatching dropped notification
   */
  public void dropped() {
    NotificationsService.Companion.enqueueDropped(mContext);
  }

  /**
   * A helper function for handling notification's response
   *
   * @param response Notification response received
   */
  public void responseReceived(NotificationResponse response) {
    NotificationsService.Companion.enqueueResponseReceived(mContext, response, null);
  }

  public Collection<NotificationCategory> getCategories() {
    return mStore.getAllNotificationCategories();
  }

  public NotificationCategory setCategory(NotificationCategory category) {
    try {
      return mStore.saveNotificationCategory(category);
    } catch (IOException e) {
      Log.e("expo-notifications", String.format("Could not save category \"%s\": %s.", category.getIdentifier(), e.getMessage()));
      e.printStackTrace();
      return null;
    }
  }

  public boolean deleteCategory(String identifier) {
    return mStore.removeNotificationCategory(identifier);
  }
}
