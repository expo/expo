package expo.modules.notifications.service.delegates;

import android.app.Activity;
import android.app.NotificationChannel;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Parcel;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import java.util.Objects;

import expo.modules.core.interfaces.ReactActivityLifecycleListener;
import expo.modules.notifications.notifications.NotificationManager;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationResponse;

public class ExpoNotificationLifecycleListener implements ReactActivityLifecycleListener {

    private NotificationManager mNotificationManager;

    public ExpoNotificationLifecycleListener(Context context, NotificationManager notificationManager) {
      mNotificationManager = notificationManager;
    }

    /**
     * This will be triggered if the app is not running,
     * and is started from clicking on a notification.
     * <p>
     * Notification data will be in activity.intent.extras
     *
     * @param activity
     * @param savedInstanceState
     */
    @Override
    public void onCreate(Activity activity, Bundle savedInstanceState) {
        Intent intent = activity.getIntent();
        if (intent != null) {
            Bundle extras = intent.getExtras();
            if (extras != null) {
                mNotificationManager.onNotificationResponseFromExtras(extras);
            }
        }
    }

    /**
     * This will be triggered if the app is running and in the background,
     * and the user clicks on a notification to open the app.
     * <p>
     * Notification data will be in intent.extras
     *
     * @param intent
     * @return
     */
    @Override
    public boolean onNewIntent(Intent intent) {
        Bundle extras = intent.getExtras();
        if (extras != null) {
            mNotificationManager.onNotificationResponseFromExtras(extras);
        }
        return ReactActivityLifecycleListener.super.onNewIntent(intent);
    }
}
