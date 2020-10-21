package expo.modules.notifications.notifications.service;

import android.content.Context;
import android.os.ResultReceiver;

import java.util.Arrays;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.service.NotificationsService;

/**
 * A POJO responsible for handling events related to scheduled notifications:
 * fetching, adding, removing and triggering. Work should be enqueued with #enqueueVerb static methods.
 */
public class NotificationSchedulingHelper {

  // Known result codes
  public static final int SUCCESS_CODE = NotificationsService.SUCCESS_CODE;
  public static final String EXCEPTION_KEY = NotificationsService.EXCEPTION_KEY;
  public static final String NOTIFICATION_REQUESTS_KEY = NotificationsService.NOTIFICATION_REQUESTS_KEY;


  /**
   * Fetches all scheduled notifications asynchronously.
   *
   * @param context        Context this is being called from
   * @param resultReceiver Receiver to be called with the results
   */
  public static void enqueueFetchAll(Context context, @Nullable ResultReceiver resultReceiver) {
    NotificationsService.Companion.getAllScheduledNotifications(context, resultReceiver);
  }

  /**
   * Fetches scheduled notification asynchronously.
   *
   * @param context        Context this is being called from
   * @param identifier     Identifier of the notification to be fetched
   * @param resultReceiver Receiver to be called with the results
   */
  public static void enqueueFetch(Context context, String identifier, @Nullable ResultReceiver resultReceiver) {
    NotificationsService.Companion.getScheduledNotification(context, identifier, resultReceiver);
  }

  /**
   * Schedule notification asynchronously.
   *
   * @param context             Context this is being called from
   * @param notificationRequest Notification request to schedule
   * @param resultReceiver      Receiver to be called with the result
   */
  public static void enqueueSchedule(Context context, NotificationRequest notificationRequest, ResultReceiver resultReceiver) {
    NotificationsService.Companion.schedule(context, notificationRequest, resultReceiver);
  }

  /**
   * Cancel scheduled notification and remove it from the storage asynchronously.
   *
   * @param context        Context this is being called from
   * @param identifier     Identifier of the notification to be removed
   * @param resultReceiver Receiver to be called with the result
   */
  public static void enqueueRemove(Context context, String identifier, ResultReceiver resultReceiver) {
    NotificationsService.Companion.removeScheduledNotification(context, identifier, resultReceiver);
  }

  /**
   * Cancel all scheduled notifications and remove them from the storage asynchronously.
   *
   * @param context        Context this is being called from
   * @param resultReceiver Receiver to be called with the result
   */
  public static void enqueueRemoveAll(Context context, ResultReceiver resultReceiver) {
    NotificationsService.Companion.removeAllScheduledNotifications(context, resultReceiver);
  }


  /**
   * Cancel selected scheduled notifications and remove them from the storage asynchronously.
   *
   * @param context        Context this is being called from
   * @param identifiers    Identifiers of selected notifications to be removed
   * @param resultReceiver Receiver to be called with the result
   */
  public static void enqueueRemoveSelected(Context context, String[] identifiers, ResultReceiver resultReceiver) {
    NotificationsService.Companion.removeScheduledNotifications(context, Arrays.asList(identifiers), resultReceiver);
  }
}
