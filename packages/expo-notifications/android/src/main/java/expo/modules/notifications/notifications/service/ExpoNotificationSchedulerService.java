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
import android.util.Pair;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InvalidClassException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Map;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.AlarmManagerCompat;
import androidx.core.app.JobIntentService;
import expo.modules.notifications.notifications.NotificationSerializer;
import expo.modules.notifications.notifications.interfaces.SchedulableNotificationTrigger;

/**
 * {@link JobIntentService} responsible for handling events related to scheduled notifications:
 * fetching, adding, removing and triggering. Work should be enqueued with #enqueueVerb static methods.
 */
public class ExpoNotificationSchedulerService extends JobIntentService {
  private static final String NOTIFICATION_SCHEDULE_ACTION = "expo.modules.notifications.SCHEDULE_EVENT";
  private static final String NOTIFICATION_TRIGGER_ACTION = "expo.modules.notifications.TRIGGER_EVENT";
  private static final String NOTIFICATIONS_FETCH_ALL_ACTION = "expo.modules.notifications.FETCH_ALL";
  private static final String NOTIFICATION_REMOVE_ACTION = "expo.modules.notifications.REMOVE_EVENT";
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
  public static final String NOTIFICATIONS_KEY = "notifications";

  private static final String NOTIFICATION_IDENTIFIER_KEY = "id";
  private static final String NOTIFICATION_REQUEST_KEY = "request";
  private static final String NOTIFICATION_TRIGGER_KEY = "trigger";
  private static final String RECEIVER_KEY = "receiver";

  private static final int JOB_ID = ExpoNotificationSchedulerService.class.getName().hashCode();
  private static final int REQUEST_CODE = JOB_ID;

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
   * See {@link #enqueueSchedule(Context, String, JSONObject, SchedulableNotificationTrigger, ResultReceiver)}
   */
  public static void enqueueSchedule(Context context, String identifier, JSONObject notification, SchedulableNotificationTrigger trigger) {
    enqueueSchedule(context, identifier, notification, trigger, null);
  }

  /**
   * Schedule notification asynchronously.
   *
   * @param context        Context this is being called from
   * @param identifier     Notification identifier
   * @param notification   Notification request
   * @param trigger        Notification trigger (if null, trigger the notification immediately)
   * @param resultReceiver Receiver to be called with the result
   */
  public static void enqueueSchedule(Context context, String identifier, JSONObject notification, @Nullable SchedulableNotificationTrigger trigger, ResultReceiver resultReceiver) {
    Intent intent = new Intent(NOTIFICATION_SCHEDULE_ACTION, getUriBuilderForIdentifier(identifier).appendPath("schedule").build());
    intent.putExtra(NOTIFICATION_IDENTIFIER_KEY, identifier);
    intent.putExtra(NOTIFICATION_REQUEST_KEY, notification.toString());
    intent.putExtra(NOTIFICATION_TRIGGER_KEY, (Parcelable) trigger);
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
   * Enqueue work to this {@link JobIntentService}.
   *
   * @param context Context this is being called from
   * @param intent  Work to handle
   */
  static void enqueueWork(Context context, Intent intent) {
    enqueueWork(context, ExpoNotificationSchedulerService.class, JOB_ID, intent);
  }

  private AlarmManager mAlarmManager;
  private SharedPreferencesNotificationsStore mStore;

  @Override
  public void onCreate() {
    super.onCreate();
    mStore = new SharedPreferencesNotificationsStore(this);
    mAlarmManager = (AlarmManager) getSystemService(ALARM_SERVICE);
  }

  /**
   * Distinguish between intent actions and call appropriate callback. Automatically handles any
   * {@link ResultReceiver} passed in under {@link #RECEIVER_KEY}.
   *
   * @param intent Work to handle
   */
  @Override
  protected void onHandleWork(@NonNull Intent intent) {
    ResultReceiver receiver = intent.getParcelableExtra(RECEIVER_KEY);
    try {
      Bundle resultData = null;
      if (NOTIFICATION_SCHEDULE_ACTION.equals(intent.getAction())) {
        scheduleNotification(
            this,
            intent.getStringExtra(NOTIFICATION_IDENTIFIER_KEY),
            new JSONObject(intent.getStringExtra(NOTIFICATION_REQUEST_KEY)),
            intent.<SchedulableNotificationTrigger>getParcelableExtra(NOTIFICATION_TRIGGER_KEY)
        );
      } else if (NOTIFICATION_TRIGGER_ACTION.equals(intent.getAction())) {
        onNotificationTriggered(this, intent.getStringExtra(NOTIFICATION_IDENTIFIER_KEY));
      } else if (NOTIFICATION_REMOVE_ACTION.equals(intent.getAction())) {
        removeNotification(this, intent.getStringExtra(NOTIFICATION_IDENTIFIER_KEY));
      } else if (NOTIFICATIONS_FETCH_ALL_ACTION.equals(intent.getAction())) {
        Bundle bundle = new Bundle();
        bundle.putParcelableArrayList(NOTIFICATIONS_KEY, fetchNotifications());
        resultData = bundle;
      } else if (NOTIFICATION_REMOVE_ALL_ACTION.equals(intent.getAction())) {
        removeAllNotifications(this);
      } else if (SETUP_ACTIONS.contains(intent.getAction())) {
        setupNotifications(this);
      } else {
        throw new IllegalArgumentException(String.format("Received intent of unrecognized action: %s. Ignoring.", intent.getAction()));
      }

      // If we ended up here, the callbacks must have completed successfully
      if (receiver != null) {
        receiver.send(SUCCESS_CODE, resultData);
      }
    } catch (JSONException | IllegalArgumentException | NullPointerException | IOException e) {
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
    for (Map.Entry<String, Pair<JSONObject, SchedulableNotificationTrigger>> entry : mStore.getAllNotifications().entrySet()) {
      String identifier = entry.getKey();
      try {
        scheduleNotification(context, identifier, entry.getValue().first, entry.getValue().second);
      } catch (Exception e) {
        Log.w("expo-notifications", String.format("Notification \"%s\" could not have been scheduled.", identifier));
      }
    }
  }

  /**
   * Fetches and serializes (using {@link NotificationSerializer}) all the known persisted notifications.
   *
   * @return List of serialized notifications
   */
  protected ArrayList<Bundle> fetchNotifications() {
    ArrayList<Bundle> notifications = new ArrayList<>();
    for (Map.Entry<String, Pair<JSONObject, SchedulableNotificationTrigger>> entry : mStore.getAllNotifications().entrySet()) {
      notifications.add(NotificationSerializer.toBundle(entry.getKey(), entry.getValue().first, entry.getValue().second));
    }
    return notifications;
  }

  /**
   * Handle notification to schedule. If trigger is null, hands the request immediately to {@link BaseNotificationsService}.
   *
   * @param context    Context this is being called from
   * @param identifier Notification identifier
   * @param request    Notification request
   * @param trigger    Notification trigger or null if the notification should be handled immediately
   */
  protected void scheduleNotification(Context context, String identifier, JSONObject request, @Nullable SchedulableNotificationTrigger trigger) {
    // If the trigger is empty, enqueue receive immediately and return.
    if (trigger == null) {
      BaseNotificationsService.enqueueReceive(context, identifier, request, null);
      return;
    }

    Date nextTriggerDate = trigger.nextTriggerDate();

    if (nextTriggerDate == null) {
      Log.d("expo-notifications", String.format("Notification \"%s\" will not trigger in the future, removing.", identifier));
      enqueueRemove(context, identifier);
      return;
    }

    try {
      mStore.saveNotification(identifier, request, trigger);
      PendingIntent pendingIntent = getTriggerPendingIntent(context, identifier);
      AlarmManagerCompat.setExactAndAllowWhileIdle(mAlarmManager, AlarmManager.RTC_WAKEUP, nextTriggerDate.getTime(), pendingIntent);
    } catch (IOException e) {
      Log.e("expo-notifications", String.format("Could not save notification \"%s\": %s.", identifier, e.getMessage()));
      e.printStackTrace();
    }
  }

  /**
   * Handle notification triggered by the alarm. Fetches notification info from the store,
   * enqueues it to {@link BaseNotificationsService} and enqueues rescheduling in case the trigger repeats.
   * <p>
   * If the storage could not return a valid notification, the notification is removed.
   *
   * @param context    Context this is being called from
   * @param identifier Notification identifier
   * @throws IOException Thrown if storage could not have fetched notification
   */
  protected void onNotificationTriggered(Context context, String identifier) throws IOException {
    try {
      Pair<JSONObject, SchedulableNotificationTrigger> notification = mStore.getNotification(identifier);
      BaseNotificationsService.enqueueReceive(context, identifier, notification.first, notification.second);
      enqueueSchedule(context, identifier, notification.first, notification.second);
    } catch (JSONException | ClassNotFoundException | InvalidClassException e) {
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
    mStore.removeNotification(identifier);
  }

  /**
   * Remove all notifications from storage and cancel any pending alarms.
   *
   * @param context Context this is being called from
   */
  protected void removeAllNotifications(Context context) {
    for (String notificationId : mStore.removeAllNotifications()) {
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
