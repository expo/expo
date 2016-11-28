package host.exp.exponent.notifications;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import java.util.HashMap;

import javax.inject.Inject;

import host.exp.exponent.ExponentManifest;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.kernel.KernelConstants;
import versioned.host.exp.exponent.modules.api.notifications.NotificationsHelper;

public class ScheduledNotificationReceiver extends BroadcastReceiver {

    @Inject
    ExponentManifest mExponentManifest;

    public void onReceive(Context context, Intent intent) {
        HashMap details = intent.getParcelableExtra(KernelConstants.NOTIFICATION_OBJECT_KEY);
        int notificationId = intent.getIntExtra(KernelConstants.NOTIFICATION_ID_KEY, 0);

        NotificationsHelper.showNotification(
                context,
                notificationId,
                details,
                mExponentManifest,
                new NotificationsHelper.Listener() {
                    public void onSuccess(int id) {
                        // do nothing
                    }

                    public void onFailure(Exception e) {
                        EXL.e(ScheduledNotificationReceiver.class.getName(), e);
                    }
                });
    }
}
