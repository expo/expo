package host.exp.exponent.notifications.backgroundActions;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.PersistableBundle;
import android.support.v4.app.NotificationManagerCompat;
import android.widget.Toast;

import org.unimodules.interfaces.taskManager.TaskInterface;

import java.util.Collections;

import expo.modules.taskManager.TaskManagerUtils;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.notifications.ExponentNotification;
import host.exp.exponent.notifications.NotificationConstants;
import versioned.host.exp.exponent.modules.api.notifications.NotificationBackgroundTaskConsumer;

public class NotificationActionReceiver extends BroadcastReceiver {
  private static final String TAG = "NotificationActionReceiver";

  @Override
  public void onReceive(Context context, Intent intent) {
    Bundle bundle = intent.getExtras();
    String notificationObject = bundle.getString(KernelConstants.NOTIFICATION_OBJECT_KEY);
    String actionId = bundle.getString(KernelConstants.NOTIFICATION_ACTION_TYPE_KEY);
    String experienceId = bundle.getString(KernelConstants.NOTIFICATION_EXPERIENCE_ID_KEY);

    ExponentNotification exponentNotification = ExponentNotification.fromJSONObjectString(notificationObject);
    PersistableBundle data = exponentNotification.toPersistableBundle("selected");
    data.putString(NotificationConstants.NOTIFICATION_ACTION_TYPE, actionId);

    TaskInterface myTask = NotificationBackgroundTaskConsumer.mTasks.get("hahayep");

    TaskManagerUtils mTaskManagerUtils = new TaskManagerUtils();
    mTaskManagerUtils.scheduleJob(context, myTask, Collections.singletonList(data));

    showToast(context, "Loading...");

    // Remove the notification.
    NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
    notificationManager.cancel(experienceId, data.getInt(NotificationConstants.NOTIFICATION_ID_KEY));
  }

  private void showToast(final Context context, final String text) {
    Handler handler = new Handler(Looper.getMainLooper());
    handler.post(new Runnable() {
      public void run() {
        Toast.makeText(context, text, Toast.LENGTH_LONG).show();
      }
    });
  }
}
