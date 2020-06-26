package expo.modules.notifications.notifications.service;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Bundle;
import android.os.ResultReceiver;
import android.util.Log;

import java.io.Serializable;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.List;
import java.util.Collection;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.JobIntentService;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationBehavior;
import expo.modules.notifications.notifications.model.NotificationResponse;
import expo.modules.notifications.notifications.model.NotificationCategory;

/**
 * A notification service foundation handling incoming intents
 * and delegating work to specific methods.
 */
public abstract class BaseNotificationsService extends JobIntentService {
  public static final String NOTIFICATION_EVENT_ACTION = "expo.modules.notifications.NOTIFICATION_EVENT";
  public static final String CATEGORY_EVENT_ACTION = "expo.modules.notifications.CATEGORY_EVENT";

  private static final List<String> VALID_ACTIONS = Arrays.asList(NOTIFICATION_EVENT_ACTION, CATEGORY_EVENT_ACTION);
  
  // Known result codes
  public static final int SUCCESS_CODE = 0;
  public static final int EXCEPTION_OCCURRED_CODE = -1;
  public static final String EXCEPTION_KEY = "exception";
  public static final String NOTIFICATIONS_KEY = "notifications";
  public static final String CATEGORIES_KEY = "categories";

  // Intent extras keys
  private static final String NOTIFICATION_KEY = "notification";
  private static final String NOTIFICATION_IDENTIFIER_KEY = "id";
  private static final String NOTIFICATION_BEHAVIOR_KEY = "behavior";
  private static final String NOTIFICATION_RESPONSE_KEY = "response";
  private static final String EVENT_TYPE_KEY = "type";
  private static final String RECEIVER_KEY = "receiver";
  private static final String CATEGORY_KEY = "category";
  private static final String CATEGORY_IDENTIFIER_KEY = "identifier";

  private static final String GET_ALL_DISPLAYED = "getAllDisplayed";
  private static final String PRESENT_TYPE = "present";
  private static final String DISMISS_TYPE = "dismiss";
  private static final String DISMISS_SELECTED_TYPE = "dismissSelected";
  private static final String DISMISS_ALL_TYPE = "dismissAll";
  private static final String RECEIVE_TYPE = "receive";
  private static final String DROPPED_TYPE = "dropped";
  private static final String RESPONSE_TYPE = "response";
  private static final String GET_CATEGORIES_TYPE = "getCategories";
  private static final String SET_CATEGORY_TYPE = "setCategory";
  private static final String DELETE_CATEGORY_TYPE = "deleteCategory";

  private static final int JOB_ID = BaseNotificationsService.class.getName().hashCode();

  /**
   * A helper function for dispatching a "fetch all displayed notifications" command to the service.
   *
   * @param context  Context where to start the service.
   * @param receiver A receiver to which send the notifications
   */
  public static void enqueueGetAllPresented(Context context, @Nullable ResultReceiver receiver) {
    Intent intent = new Intent(NOTIFICATION_EVENT_ACTION, getUriBuilder().build());
    intent.putExtra(EVENT_TYPE_KEY, GET_ALL_DISPLAYED);
    intent.putExtra(RECEIVER_KEY, receiver);
    enqueueWork(context, intent);
  }

  /**
   * A helper function for dispatching a "present notification" command to the service.
   *
   * @param context      Context where to start the service.
   * @param notification Notification to present
   * @param behavior     Allowed notification behavior
   * @param receiver     A receiver to which send the result of presenting the notification
   */
  public static void enqueuePresent(Context context, @NonNull Notification notification, @Nullable NotificationBehavior behavior, @Nullable ResultReceiver receiver) {
    Intent intent = new Intent(NOTIFICATION_EVENT_ACTION, getUriBuilderForIdentifier(notification.getNotificationRequest().getIdentifier()).appendPath("present").build());
    intent.putExtra(EVENT_TYPE_KEY, PRESENT_TYPE);
    intent.putExtra(NOTIFICATION_KEY, notification);
    intent.putExtra(NOTIFICATION_BEHAVIOR_KEY, behavior);
    intent.putExtra(RECEIVER_KEY, receiver);
    enqueueWork(context, intent);
  }

  /**
   * A helper function for dispatching a "notification received" command to the service.
   *
   * @param context      Context where to start the service.
   * @param notification Notification received
   */
  public static void enqueueReceive(Context context, Notification notification) {
    enqueueReceive(context, notification, null);
  }

  /**
   * A helper function for dispatching a "notification received" command to the service.
   *
   * @param context      Context where to start the service.
   * @param notification Notification received
   * @param receiver     Result receiver
   */
  public static void enqueueReceive(Context context, Notification notification, ResultReceiver receiver) {
    Intent intent = new Intent(NOTIFICATION_EVENT_ACTION, getUriBuilderForIdentifier(notification.getNotificationRequest().getIdentifier()).appendPath("receive").build());
    intent.putExtra(EVENT_TYPE_KEY, RECEIVE_TYPE);
    intent.putExtra(NOTIFICATION_KEY, notification);
    intent.putExtra(RECEIVER_KEY, receiver);
    enqueueWork(context, intent);
  }

  /**
   * A helper function for dispatching a "dismiss notification" command to the service.
   *
   * @param context    Context where to start the service.
   * @param identifier Notification identifier
   */
  public static void enqueueDismiss(Context context, @NonNull String identifier, @Nullable ResultReceiver receiver) {
    Intent intent = new Intent(NOTIFICATION_EVENT_ACTION, getUriBuilderForIdentifier(identifier).appendPath("dismiss").build());
    intent.putExtra(EVENT_TYPE_KEY, DISMISS_TYPE);
    intent.putExtra(NOTIFICATION_IDENTIFIER_KEY, identifier);
    intent.putExtra(RECEIVER_KEY, receiver);
    enqueueWork(context, intent);
  }

  /**
   * A helper function for dispatching a "dismiss selected notification" command to the service.
   *
   * @param context    Context where to start the service.
   * @param identifiers Notification identifiers
   */
  public static void enqueueDismissSelected(Context context, @NonNull String[] identifiers, @Nullable ResultReceiver receiver) {
    Intent intent = new Intent(NOTIFICATION_EVENT_ACTION);
    intent.putExtra(EVENT_TYPE_KEY, DISMISS_SELECTED_TYPE);
    intent.putExtra(NOTIFICATION_IDENTIFIER_KEY, identifiers);
    intent.putExtra(RECEIVER_KEY, receiver);
    enqueueWork(context, intent);
  }

  /**
   * A helper function for dispatching a "dismiss all notifications" command to the service.
   *
   * @param context Context where to start the service.
   */
  public static void enqueueDismissAll(Context context, @Nullable ResultReceiver receiver) {
    Intent intent = new Intent(NOTIFICATION_EVENT_ACTION);
    intent.putExtra(EVENT_TYPE_KEY, DISMISS_ALL_TYPE);
    intent.putExtra(RECEIVER_KEY, receiver);
    enqueueWork(context, intent);
  }

  /**
   * A helper function for dispatching a "notification response received" command to the service.
   *
   * @param context  Context where to start the service
   * @param response Notification response received
   */
  public static void enqueueResponseReceived(Context context, NotificationResponse response) {
    Intent intent = new Intent(NOTIFICATION_EVENT_ACTION, getUriBuilderForIdentifier(response.getNotification().getNotificationRequest().getIdentifier()).appendPath("receive").build());
    intent.putExtra(EVENT_TYPE_KEY, RESPONSE_TYPE);
    intent.putExtra(NOTIFICATION_RESPONSE_KEY, response);
    enqueueWork(context, intent);
  }

  /**
   * A helper function for dispatching a "notifications dropped" command to the service.
   *
   * @param context Context where to start the service.
   */
  public static void enqueueDropped(Context context) {
    Intent intent = new Intent(NOTIFICATION_EVENT_ACTION);
    intent.putExtra(EVENT_TYPE_KEY, DROPPED_TYPE);
    enqueueWork(context, intent);
  }

  /**
   * A helper function for dispatching a "get notification categories" command to the service.
   *
   * @param context Context where to start the service.
   */
  public static void enqueGetCategories(Context context,  @Nullable ResultReceiver receiver) {
    Intent intent = new Intent(CATEGORY_EVENT_ACTION);
    intent.putExtra(EVENT_TYPE_KEY, GET_CATEGORIES_TYPE);
    intent.putExtra(RECEIVER_KEY, receiver);
    enqueueWork(context, intent);
  }

  /**
   * A helper function for dispatching a "set notification category" command to the service.
   *
   * @param context  Context where to start the service.
   * @param category Notification category to be set
   */
  public static void enqueSetCategory(Context context, NotificationCategory category, @Nullable ResultReceiver receiver) {
    Intent intent = new Intent(CATEGORY_EVENT_ACTION);
    intent.putExtra(EVENT_TYPE_KEY, SET_CATEGORY_TYPE);
    intent.putExtra(CATEGORY_KEY, (Serializable)category);
    intent.putExtra(RECEIVER_KEY, receiver);
    enqueueWork(context, intent);
  }  

  /**
   * A helper function for dispatching a "delete notification category" command to the service.
   *
   * @param context    Context where to start the service.
   * @param identifier Category Identifier
   */
  public static void enqueDeleteCategory(Context context, String identifier,  @Nullable ResultReceiver receiver) {
    Intent intent = new Intent(CATEGORY_EVENT_ACTION);
    intent.putExtra(EVENT_TYPE_KEY, DELETE_CATEGORY_TYPE);
    intent.putExtra(CATEGORY_IDENTIFIER_KEY, identifier);
    intent.putExtra(RECEIVER_KEY, receiver);
    enqueueWork(context, intent);
  }  

  /**
   * Sends the intent to the best service to handle the {@link #NOTIFICATION_EVENT_ACTION} intent.
   *
   * @param context Context where to start the service
   * @param intent  Intent to dispatch
   */
  private static void enqueueWork(Context context, Intent intent) {
    String actionType = intent.getAction();
    Intent searchIntent = new Intent(actionType).setPackage(context.getPackageName());
    ResolveInfo resolveInfo = context.getPackageManager().resolveService(searchIntent, 0);
    if (resolveInfo == null || resolveInfo.serviceInfo == null) {
      Log.e("expo-notifications", String.format("No service capable of handling notifications found (intent = %s). Ensure that you have configured your AndroidManifest.xml properly.", NOTIFICATION_EVENT_ACTION));
      return;
    }
    ComponentName component = new ComponentName(resolveInfo.serviceInfo.packageName, resolveInfo.serviceInfo.name);
    enqueueWork(context, component, JOB_ID, intent);
  }

  @Override
  protected void onHandleWork(@NonNull Intent intent) {
    ResultReceiver receiver = intent.getParcelableExtra(RECEIVER_KEY);
    try {
      String actionType = intent.getAction();
      // Invalid action provided
      if (!VALID_ACTIONS.contains(actionType)) {
        throw new IllegalArgumentException(String.format("Received intent of unrecognized action: %s. Ignoring.", intent.getAction()));
      }

      Bundle resultData = null;
      // Let's go through known actions and trigger respective callbacks

      String eventType = intent.getStringExtra(EVENT_TYPE_KEY);

      switch(actionType) {
        case NOTIFICATION_EVENT_ACTION :
          if (PRESENT_TYPE.equals(eventType)) {
            onNotificationPresent(
                intent.<Notification>getParcelableExtra(NOTIFICATION_KEY),
                intent.<NotificationBehavior>getParcelableExtra(NOTIFICATION_BEHAVIOR_KEY)
            );
          } else if (RECEIVE_TYPE.equals(eventType)) {
            onNotificationReceived(intent.<Notification>getParcelableExtra(NOTIFICATION_KEY));
          } else if (DISMISS_TYPE.equals(eventType)) {
            onNotificationDismiss(intent.getStringExtra(NOTIFICATION_IDENTIFIER_KEY));
          } else if (DISMISS_SELECTED_TYPE.equals(eventType)) {
            String[] identifiers = intent.getStringArrayExtra(NOTIFICATION_IDENTIFIER_KEY);
            for (String identifier : identifiers) {
              onNotificationDismiss(identifier);
            }
          } else if (DISMISS_ALL_TYPE.equals(eventType)) {
            onDismissAllNotifications();
          } else if (DROPPED_TYPE.equals(eventType)) {
            onNotificationsDropped();
          } else if (RESPONSE_TYPE.equals(eventType)) {
            onNotificationResponseReceived(intent.<NotificationResponse>getParcelableExtra(NOTIFICATION_RESPONSE_KEY));
          } else if (GET_ALL_DISPLAYED.equals(eventType)) {
            Bundle bundle = new Bundle();
            bundle.putParcelableArrayList(NOTIFICATIONS_KEY, new ArrayList<>(getDisplayedNotifications()));
            resultData = bundle;
          } else {
            throw new IllegalArgumentException(String.format("Received event of unrecognized type: %s. Ignoring.", intent.getAction()));
          }
          break;
        case CATEGORY_EVENT_ACTION :
          if (GET_CATEGORIES_TYPE.equals(eventType)) {
            Bundle bundle = new Bundle();
            bundle.putParcelableArrayList(CATEGORIES_KEY, new ArrayList<>(onGetCategories()));
            resultData = bundle;
          } else if (SET_CATEGORY_TYPE.equals(eventType)) {
            Bundle bundle = new Bundle();
            bundle.putParcelable(CATEGORIES_KEY, onSetCategory(intent.<NotificationCategory>getParcelableExtra(CATEGORY_KEY)));
            resultData = bundle;
          } else if (DELETE_CATEGORY_TYPE.equals(eventType)) {
            boolean success = onDeleteCategory(intent.getStringExtra(CATEGORY_IDENTIFIER_KEY));
            Bundle bundle = new Bundle();
            bundle.putByte(CATEGORIES_KEY, (byte) (success ? 1 : 0));
            resultData = bundle;
          } else {
            throw new IllegalArgumentException(String.format("Received event of unrecognized type: %s. Ignoring.", intent.getAction()));
          }
          break;
      }

      // If we ended up here, the callbacks must have completed successfully
      if (receiver != null) {
        receiver.send(SUCCESS_CODE, resultData);
      }
    } catch (IllegalArgumentException | NullPointerException e) {
      Log.e("expo-notifications", String.format("Action %s failed: %s.", intent.getAction(), e.getMessage()));
      e.printStackTrace();

      if (receiver != null) {
        Bundle bundle = new Bundle();
        bundle.putSerializable(EXCEPTION_KEY, e);
        receiver.send(EXCEPTION_OCCURRED_CODE, bundle);
      }
    }
  }

  /**
   * Callback called when the service is supposed to present a notification.
   *
   * @param notification Notification to present
   * @param behavior     Allowed notification behavior
   */
  protected void onNotificationPresent(Notification notification, NotificationBehavior behavior) {
  }

  /**
   * Callback called when the notifications system is informed of a new notification.
   *
   * @param notification Notification received
   */
  protected void onNotificationReceived(Notification notification) {
  }

  /**
   * Callback called when the service is supposed to dismiss a notification.
   *
   * @param identifier Notification identifier
   */
  protected void onNotificationDismiss(String identifier) {
  }

  /**
   * Callback called when the service is supposed to dismiss all notifications.
   */
  protected void onDismissAllNotifications() {
  }

  /**
   * Callback called when the notifications system is informed of a new notification response.
   *
   * @param response Notification response received
   */
  protected void onNotificationResponseReceived(NotificationResponse response) {
  }

  /**
   * Callback called when some notifications dispatched by the backend haven't been delivered to the device.
   */
  protected void onNotificationsDropped() {
  }

  /**
   * Callback called when the notifications system is supposed to return a list of currently displayed
   * notifications.
   *
   * @return A list of currently displayed notifications,
   */
  protected Collection<Notification> getDisplayedNotifications() {
    return null;
  }

  /**
   * Callback called when getting all notification categories.
   */
  protected Collection<NotificationCategory> onGetCategories() {
    return null;
  }

  /**
   * Callback called when setting a notification category.
   */
  protected NotificationCategory onSetCategory(NotificationCategory category) {
    return null;
  }

  /**
   * Callback called when deleting a notification category.
   */
  protected boolean onDeleteCategory(String identifier) {
    return false;
  }

  protected static Uri.Builder getUriBuilder() {
    return Uri.parse("expo-notifications://notifications/").buildUpon();
  }

  protected static Uri.Builder getUriBuilderForIdentifier(String identifier) {
    return getUriBuilder().appendPath(identifier);
  }
}
