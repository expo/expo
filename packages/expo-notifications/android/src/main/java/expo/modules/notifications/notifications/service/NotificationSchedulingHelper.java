package expo.modules.notifications.notifications.service;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Parcelable;
import android.os.ResultReceiver;
import android.util.Log;

import java.io.IOException;
import java.io.InvalidClassException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.AlarmManagerCompat;
import expo.modules.notifications.notifications.NotificationSerializer;
import expo.modules.notifications.notifications.interfaces.NotificationTrigger;
import expo.modules.notifications.notifications.interfaces.NotificationsScoper;
import expo.modules.notifications.notifications.interfaces.SchedulableNotificationTrigger;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationRequest;

import static android.content.Context.ALARM_SERVICE;

/**
 * A POJO responsible for handling events related to scheduled notifications:
 * fetching, adding, removing and triggering. Work should be enqueued with #enqueueVerb static methods.
 */
public class NotificationSchedulingHelper {
  private static final String NOTIFICATION_SCHEDULE_ACTION = "expo.modules.notifications.SCHEDULE_EVENT";
  private static final String NOTIFICATION_TRIGGER_ACTION = "expo.modules.notifications.TRIGGER_EVENT";
  private static final String NOTIFICATIONS_FETCH_ALL_ACTION = "expo.modules.notifications.FETCH_ALL";
  private static final String NOTIFICATIONS_FETCH_ACTION = "expo.modules.notifications.FETCH";
  private static final String NOTIFICATION_REMOVE_ACTION = "expo.modules.notifications.REMOVE_EVENT";
  private static final String NOTIFICATION_REMOVE_SELECTED_ACTION = "expo.modules.notifications.REMOVE_SELECTED_EVENTS";
  private static final String NOTIFICATION_REMOVE_ALL_ACTION = "expo.modules.notifications.REMOVE_ALL_EVENTS";

  private static final List<String> SETUP_ACTIONS = Arrays.asList(
    Intent.ACTION_BOOT_COMPLETED,
    Intent.ACTION_REBOOT,
    "android.intent.action.QUICKBOOT_POWERON",
    "com.htc.intent.action.QUICKBOOT_POWERON"
  );

  // Known result codes
  public static final int SUCCESS_CODE = 0;
  public static final int EXCEPTION_OCCURRED_CODE = -1;
  public static final String EXCEPTION_KEY = "exception";
  public static final String NOTIFICATION_REQUESTS_KEY = "notificationRequests";

  private static final String NOTIFICATION_IDENTIFIER_KEY = "id";
  private static final String NOTIFICATION_REQUEST_KEY = "request";
  private static final String RECEIVER_KEY = "receiver";

  private static final int JOB_ID = NotificationSchedulingHelper.class.getName().hashCode();
  private static final int REQUEST_CODE = JOB_ID;

  private NotificationsHelper mNotificationsHelper;

  /**
   * Fetches all scheduled notifications asynchronously.
   *
   * @param context        Context this is being called from
   * @param resultReceiver Receiver to be called with the results
   */
  public static void enqueueFetchAll(Context context, @Nullable ResultReceiver resultReceiver) {
    Intent intent = new Intent(NOTIFICATIONS_FETCH_ALL_ACTION, getUriBuilder().build());
    intent.putExtra(RECEIVER_KEY, resultReceiver);
    enqueueWork(context, intent);
  }

  /**
   * Fetches scheduled notification asynchronously.
   *
   * @param context        Context this is being called from
   * @param identifier     Identifier of the notification to be fetched
   * @param resultReceiver Receiver to be called with the results
   */
  public static void enqueueFetch(Context context, String identifier, @Nullable ResultReceiver resultReceiver) {
    Intent intent = new Intent(NOTIFICATIONS_FETCH_ACTION, getUriBuilderForIdentifier(identifier).appendPath("fetch").build());
    intent.putExtra(NOTIFICATION_IDENTIFIER_KEY, identifier);
    intent.putExtra(RECEIVER_KEY, resultReceiver);
    enqueueWork(context, intent);
  }

  /**
   * See {@link #enqueueSchedule(Context, NotificationRequest, ResultReceiver)}
   */
  public static void enqueueSchedule(Context context, NotificationRequest notificationRequest) {
    enqueueSchedule(context, notificationRequest, null);
  }

  /**
   * Schedule notification asynchronously.
   *
   * @param context             Context this is being called from
   * @param notificationRequest Notification request to schedule
   * @param resultReceiver      Receiver to be called with the result
   */
  public static void enqueueSchedule(Context context, NotificationRequest notificationRequest, ResultReceiver resultReceiver) {
    Intent intent = new Intent(NOTIFICATION_SCHEDULE_ACTION, getUriBuilderForIdentifier(notificationRequest.getIdentifier()).appendPath("schedule").build());
    intent.putExtra(NOTIFICATION_REQUEST_KEY, (Parcelable) notificationRequest);
    intent.putExtra(RECEIVER_KEY, resultReceiver);
    enqueueWork(context, intent);
  }

  /**
   * See {@link #enqueueRemove(Context, String, ResultReceiver)}
   */
  public static void enqueueRemove(Context context, String identifier) {
    enqueueRemove(context, identifier, null);
  }

  /**
   * Cancel scheduled notification and remove it from the storage asynchronously.
   *
   * @param context        Context this is being called from
   * @param identifier     Identifier of the notification to be removed
   * @param resultReceiver Receiver to be called with the result
   */
  public static void enqueueRemove(Context context, String identifier, ResultReceiver resultReceiver) {
    Intent intent = new Intent(NOTIFICATION_REMOVE_ACTION, getUriBuilderForIdentifier(identifier).appendPath("remove").build());
    intent.putExtra(NOTIFICATION_IDENTIFIER_KEY, identifier);
    intent.putExtra(RECEIVER_KEY, resultReceiver);
    enqueueWork(context, intent);
  }

  /**
   * Cancel all scheduled notifications and remove them from the storage asynchronously.
   *
   * @param context        Context this is being called from
   * @param resultReceiver Receiver to be called with the result
   */
  public static void enqueueRemoveAll(Context context, ResultReceiver resultReceiver) {
    Intent intent = new Intent(NOTIFICATION_REMOVE_ALL_ACTION);
    intent.putExtra(RECEIVER_KEY, resultReceiver);
    enqueueWork(context, intent);
  }


  /**
   * Cancel selected scheduled notifications and remove them from the storage asynchronously.
   *
   * @param context        Context this is being called from
   * @param identifiers    Identifiers of selected notifications to be removed
   * @param resultReceiver Receiver to be called with the result
   */
  public static void enqueueRemoveSelected(Context context, String[] identifiers, ResultReceiver resultReceiver) {
    Intent intent = new Intent(NOTIFICATION_REMOVE_SELECTED_ACTION);
    intent.putExtra(NOTIFICATION_IDENTIFIER_KEY, identifiers);
    intent.putExtra(RECEIVER_KEY, resultReceiver);
    enqueueWork(context, intent);
  }

  private Context mContext;
  private AlarmManager mAlarmManager;
  private SharedPreferencesNotificationsStore mStore;

  /**
   * Enqueue work to this class.
   *
   * @param context Context this is being called from
   * @param intent  Work to handle
   */
  static void enqueueWork(Context context, Intent intent) {
    new NotificationSchedulingHelper(context).onHandleWork(intent);
  }

  private NotificationSchedulingHelper(Context context) {
    mContext = context;
    mStore = new SharedPreferencesNotificationsStore(context);
    mAlarmManager = (AlarmManager) context.getSystemService(ALARM_SERVICE);
    mNotificationsHelper = createNotificationHelper(context);
  }

  protected NotificationsHelper createNotificationHelper(Context context) {
    return new NotificationsHelper(context, NotificationsScoper.create(context).createReconstructor());
  }

  /**
   * Distinguish between intent actions and call appropriate callback. Automatically handles any
   * {@link ResultReceiver} passed in under {@link #RECEIVER_KEY}.
   *
   * @param intent Work to handle
   */
  protected void onHandleWork(@NonNull Intent intent) {
    ResultReceiver receiver = intent.getParcelableExtra(RECEIVER_KEY);
    try {
      Bundle resultData = null;
      if (NOTIFICATION_SCHEDULE_ACTION.equals(intent.getAction())) {
        scheduleNotification(
          mContext,
          intent.getParcelableExtra(NOTIFICATION_REQUEST_KEY)
        );
      } else if (NOTIFICATION_TRIGGER_ACTION.equals(intent.getAction())) {
        onNotificationTriggered(mContext, intent.getStringExtra(NOTIFICATION_IDENTIFIER_KEY));
      } else if (NOTIFICATION_REMOVE_ACTION.equals(intent.getAction())) {
        removeNotification(mContext, intent.getStringExtra(NOTIFICATION_IDENTIFIER_KEY));
      } else if (NOTIFICATIONS_FETCH_ALL_ACTION.equals(intent.getAction())) {
        Bundle bundle = new Bundle();
        bundle.putParcelableArrayList(NOTIFICATION_REQUESTS_KEY, new ArrayList<>(fetchNotifications()));
        resultData = bundle;
      } else if (NOTIFICATIONS_FETCH_ACTION.equals(intent.getAction())) {
        Bundle bundle = new Bundle();
        bundle.putParcelable(NOTIFICATION_REQUESTS_KEY, fetchNotification(intent.getStringExtra(NOTIFICATION_IDENTIFIER_KEY)));
        resultData = bundle;
      } else if (NOTIFICATION_REMOVE_SELECTED_ACTION.equals(intent.getAction())) {
        removeSelectedNotifications(mContext, intent.getStringArrayExtra(NOTIFICATION_IDENTIFIER_KEY));
      } else if (NOTIFICATION_REMOVE_ALL_ACTION.equals(intent.getAction())) {
        removeAllNotifications(mContext);
      } else if (SETUP_ACTIONS.contains(intent.getAction())) {
        setupNotifications(mContext);
      } else {
        throw new IllegalArgumentException(String.format("Received intent of unrecognized action: %s. Ignoring.", intent.getAction()));
      }

      // If we ended up here, the callbacks must have completed successfully
      if (receiver != null) {
        receiver.send(SUCCESS_CODE, resultData);
      }
    } catch (IllegalArgumentException | NullPointerException | IOException e) {
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
   * Schedule alarms for all known notifications.
   *
   * @param context Context this is being called from
   */
  protected void setupNotifications(Context context) {
    for (NotificationRequest request : mStore.getAllNotificationRequests()) {
      try {
        scheduleNotification(context, request);
      } catch (Exception e) {
        Log.w("expo-notifications", String.format("Notification \"%s\" could not have been scheduled.", request.getIdentifier()));
      }
    }
  }

  /**
   * Fetches and serializes (using {@link NotificationSerializer}) all the known persisted notifications.
   *
   * @return List of serialized notifications
   */
  protected Collection<NotificationRequest> fetchNotifications() {
    return mStore.getAllNotificationRequests();
  }

  /**
   * Fetches and serializes (using {@link NotificationSerializer}) a single notification with specific identifier.
   *
   * @param identifier Identifier of the notification to be fetched
   * @return Instance of the NotificationRequest or null if the notification wasn't find
   */
  protected NotificationRequest fetchNotification(String identifier) {
    try {
      return mStore.getNotificationRequest(identifier);
    } catch (IOException | ClassNotFoundException | NullPointerException e) {
      return null;
    }
  }

  /**
   * Handle notification to schedule. If trigger is null, hands the request immediately to {@link NotificationsHelper}.
   *
   * @param context             Context this is being called from
   * @param notificationRequest Notification request
   */
  protected void scheduleNotification(Context context, NotificationRequest notificationRequest) {
    NotificationTrigger trigger = notificationRequest.getTrigger();

    // If the trigger is empty, handle receive immediately and return.
    if (!(trigger instanceof SchedulableNotificationTrigger)) {
      Notification notification = new Notification(notificationRequest);
      mNotificationsHelper.notificationReceived(notification, null);
      return;
    }

    SchedulableNotificationTrigger schedulableTrigger = (SchedulableNotificationTrigger) trigger;
    String identifier = notificationRequest.getIdentifier();

    Date nextTriggerDate = schedulableTrigger.nextTriggerDate();

    if (nextTriggerDate == null) {

      Log.d("expo-notifications", String.format("Notification \"%s\" will not trigger in the future, removing.", identifier));
      enqueueRemove(context, identifier);
      return;
    }

    try {
      mStore.saveNotificationRequest(notificationRequest);
      PendingIntent pendingIntent = getTriggerPendingIntent(context, identifier);
      AlarmManagerCompat.setExactAndAllowWhileIdle(mAlarmManager, AlarmManager.RTC_WAKEUP, nextTriggerDate.getTime(), pendingIntent);
    } catch (IOException e) {
      Log.e("expo-notifications", String.format("Could not save notification \"%s\": %s.", identifier, e.getMessage()));
      e.printStackTrace();
    }
  }

  /**
   * Handle notification triggered by the alarm. Fetches notification info from the store,
   * enqueues it to {@link NotificationsHelper} and enqueues rescheduling in case the trigger repeats.
   * <p>
   * If the storage could not return a valid notification, the notification is removed.
   *
   * @param context    Context this is being called from
   * @param identifier Notification identifier
   * @throws IOException Thrown if storage could not have fetched notification
   */
  protected void onNotificationTriggered(Context context, String identifier) throws IOException {
    try {
      NotificationRequest notificationRequest = mStore.getNotificationRequest(identifier);
      Notification notification = new Notification(notificationRequest);
      mNotificationsHelper.notificationReceived(notification);
      enqueueSchedule(context, notificationRequest);
    } catch (ClassNotFoundException | InvalidClassException e) {
      Log.e("expo-notifications", "An exception occurred while triggering notification " + identifier + ", removing. " + e.getMessage());
      e.printStackTrace();
      enqueueRemove(context, identifier);
    }
  }

  /**
   * Remove notification from storage and cancel any pending alarms.
   *
   * @param context    Context this is being called from
   * @param identifier Notification identifier
   */
  protected void removeNotification(Context context, String identifier) {
    mAlarmManager.cancel(getTriggerPendingIntent(context, identifier));
    mStore.removeNotificationRequest(identifier);
  }

  /**
   * Remove selected notifications from storage and cancel any pending alarms.
   *
   * @param context     Context this is being called from
   * @param identifiers Notification identifiers
   */
  protected void removeSelectedNotifications(Context context, String[] identifiers) {
    for (String identifier : identifiers) {
      removeNotification(context, identifier);
    }
  }

  /**
   * Remove all notifications from storage and cancel any pending alarms.
   *
   * @param context Context this is being called from
   */
  protected void removeAllNotifications(Context context) {
    for (String notificationId : mStore.removeAllNotificationRequests()) {
      mAlarmManager.cancel(getTriggerPendingIntent(context, notificationId));
    }
  }

  /**
   * Creates and returns a pending intent that will trigger {@link ScheduledAlarmReceiver},
   * which hands off the work to this class. The intent triggers notification of the given identifier.
   *
   * @param context    Context this is being called from
   * @param identifier Notification identifier
   * @return {@link PendingIntent} received {@link ScheduledAlarmReceiver}, triggering notification of given ID.
   */
  protected PendingIntent getTriggerPendingIntent(Context context, String identifier) {
    Intent intent = new Intent(context, ScheduledAlarmReceiver.class);
    intent.setAction(NOTIFICATION_TRIGGER_ACTION);
    intent.putExtra(NOTIFICATION_IDENTIFIER_KEY, identifier);
    intent.setData(getUriBuilderForIdentifier(identifier).appendPath("trigger").build());
    return PendingIntent.getBroadcast(context, REQUEST_CODE, intent, PendingIntent.FLAG_UPDATE_CURRENT);
  }

  protected static Uri.Builder getUriBuilder() {
    return Uri.parse("expo-notifications://notifications/").buildUpon();
  }

  protected static Uri.Builder getUriBuilderForIdentifier(String identifier) {
    return getUriBuilder().appendPath(identifier);
  }
}
