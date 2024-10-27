package expo.modules.notifications.service.delegates;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import expo.modules.core.interfaces.ReactActivityLifecycleListener;
import expo.modules.notifications.notifications.NotificationManager;
import expo.modules.notifications.notifications.debug.DebugLogging;

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
                if (extras.containsKey("notificationResponse")) {
                    Log.d("ReactNativeJS", "[native] ExpoNotificationLifecycleListener contains an unmarshaled notification response. Skipping.");
                    return;
                }
                DebugLogging.logBundle("ExpoNotificationLifeCycleListener.onCreate:", extras);
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
            if (extras.containsKey("notificationResponse")) {
                Log.d("ReactNativeJS", "[native] ExpoNotificationLifecycleListener contains an unmarshaled notification response. Skipping.");
                intent.removeExtra("notificationResponse");
                return ReactActivityLifecycleListener.super.onNewIntent(intent);
            }
            DebugLogging.logBundle("ExpoNotificationLifeCycleListener.onNewIntent:", extras);
            mNotificationManager.onNotificationResponseFromExtras(extras);
        }
        return ReactActivityLifecycleListener.super.onNewIntent(intent);
    }
}
