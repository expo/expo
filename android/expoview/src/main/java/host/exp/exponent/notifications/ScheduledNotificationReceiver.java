package host.exp.exponent.notifications;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import java.util.HashMap;

import javax.inject.Inject;

import android.os.Bundle;
import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.kernel.KernelConstants;
import host.exp.exponent.notifications.managers.SchedulersManagerProxy;

public class ScheduledNotificationReceiver extends BroadcastReceiver {

  @Inject
  ExponentManifest mExponentManifest;

  public ScheduledNotificationReceiver() {
    NativeModuleDepsProvider.getInstance().inject(ScheduledNotificationReceiver.class, this);
  }

  public void onReceive(Context context, Intent intent) {
    Bundle bundle = intent.getExtras();
    HashMap details = (HashMap) bundle.getSerializable(KernelConstants.NOTIFICATION_OBJECT_KEY);
    int notificationId = bundle.getInt(KernelConstants.NOTIFICATION_ID_KEY, 0);
    String schedulerId = (String) details.get(SchedulersManagerProxy.SCHEDULER_ID);

    SchedulersManagerProxy.getInstance(context).rescheduleOrDelete(schedulerId);

    NotificationHelper.showNotification(
            context,
            notificationId,
            details,
            mExponentManifest,
            new NotificationHelper.Listener() {
                public void onSuccess(int id) {
                    // do nothing
                }

                public void onFailure(Exception e) {
                    EXL.e(ScheduledNotificationReceiver.class.getName(), e);
                }
            });
  }
}

