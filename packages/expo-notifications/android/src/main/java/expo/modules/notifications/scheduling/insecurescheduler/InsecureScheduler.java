package expo.modules.notifications.scheduling.insecurescheduler;

import android.content.Context;

import java.util.HashMap;

public interface InsecureScheduler {

  void schedule(String appId, long elapsedTime, int notificationId, HashMap notification, final Context context);

  void cancelScheduled(String appId, int notificationId, final Context context);

  void cancelAllScheduled(String appId, final Context context);

}
