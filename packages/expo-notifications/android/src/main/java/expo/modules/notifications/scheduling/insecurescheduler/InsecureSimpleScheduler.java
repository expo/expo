package expo.modules.notifications.scheduling.insecurescheduler;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import java.util.HashMap;
import java.util.List;

import expo.modules.notifications.scheduling.insecurescheduler.repository.ScheduledNotification;
import expo.modules.notifications.scheduling.insecurescheduler.repository.ScheduledNotificationRepository;

import static expo.modules.notifications.NotificationConstants.NOTIFICATION_EXACT_TIME;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_ID_KEY;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_OBJECT_KEY;

public class InsecureSimpleScheduler implements InsecureScheduler {

  @Override
  public void schedule(String appId, long elapsedTime, int notificationId, HashMap notification, Context context) {
    Intent notificationIntent = new Intent(context, ScheduledNotificationReceiver.class);

    notificationIntent.setType(appId);
    notificationIntent.setAction(String.valueOf(notificationId));

    notificationIntent.putExtra(NOTIFICATION_ID_KEY, notificationId);
    notificationIntent.putExtra(NOTIFICATION_OBJECT_KEY, notification);

    PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT);
    AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

    ScheduledNotificationRepository.getInstance().addScheduledNotification(appId, notificationId);

    if (notification.containsKey(NOTIFICATION_EXACT_TIME) && notification.containsKey(NOTIFICATION_EXACT_TIME)) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        alarmManager.setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, elapsedTime, pendingIntent);
      } else {
        alarmManager.setExact(AlarmManager.ELAPSED_REALTIME_WAKEUP, elapsedTime, pendingIntent);
      }
    } else {
      alarmManager.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, elapsedTime, pendingIntent);
    }
  }

  @Override
  public void cancelScheduled(String appId, int notificationId, Context context) {
    ScheduledNotificationRepository.getInstance().deleteScheduledNotification(appId, notificationId);

    Intent notificationIntent = new Intent(context, ScheduledNotificationReceiver.class);

    notificationIntent.setType(appId);
    notificationIntent.setAction(String.valueOf(notificationId));

    PendingIntent pendingIntent = PendingIntent.getBroadcast(context, 0, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT);
    AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
    alarmManager.cancel(pendingIntent);
  }

  @Override
  public void cancelAllScheduled(String appId, Context context) {
    List<ScheduledNotification> scheduledNotificationList = ScheduledNotificationRepository
        .getInstance()
        .getScheduledNotificationsForExperience(appId);

    for (ScheduledNotification scheduledNotification : scheduledNotificationList) {
      cancelScheduled(appId, scheduledNotification.getNotificationId(), context);
    }
  }
}
