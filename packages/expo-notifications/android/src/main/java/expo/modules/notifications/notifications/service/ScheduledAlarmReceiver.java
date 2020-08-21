package expo.modules.notifications.notifications.service;

import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * A {@link BroadcastReceiver} triggered by {@link android.app.AlarmManager}, handing off
 * all the work to {@link NotificationSchedulingHelper}. Unfortunately we cannot enqueue work
 * to {@link androidx.core.app.JobIntentService} straight from the {@link android.app.PendingIntent},
 * and we don't want to use a deprecated {@link android.app.IntentService}.
 * <p>
 * See: https://stackoverflow.com/a/46139903
 */
public class ScheduledAlarmReceiver extends BroadcastReceiver {
  @SuppressLint("UnsafeProtectedBroadcastReceiver")
  @Override
  public void onReceive(Context context, Intent intent) {
    NotificationSchedulingHelper.enqueueWork(context, intent);
  }
}
