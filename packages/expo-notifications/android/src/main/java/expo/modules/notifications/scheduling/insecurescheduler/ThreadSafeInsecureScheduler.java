package expo.modules.notifications.scheduling.insecurescheduler;

import android.content.Context;

import java.util.HashMap;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

public class ThreadSafeInsecureScheduler implements InsecureScheduler {

  private volatile static InsecureScheduler insecureScheduler = new InsecureSimpleScheduler();

  private ThreadSafeInsecureScheduler() {}

  private Executor mExecutor = Executors.newSingleThreadExecutor();

  public static InsecureScheduler getInstance() {
    return insecureScheduler;
  }

  @Override
  public void schedule(String appId, long elapsedTime, int notificationId, HashMap notification, Context context) {
    mExecutor.execute(() -> insecureScheduler.schedule(appId, elapsedTime, notificationId, notification, context));
  }

  @Override
  public void cancelScheduled(String appId, int notificationId, Context context) {
    mExecutor.execute(() -> insecureScheduler.cancelScheduled(appId, notificationId, context));
  }

  @Override
  public void cancelAllScheduled(String appId, Context context) {
    mExecutor.execute(() -> insecureScheduler.cancelAllScheduled(appId, context));
  }
}
