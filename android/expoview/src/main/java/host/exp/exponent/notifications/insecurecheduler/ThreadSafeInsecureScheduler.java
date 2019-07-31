package host.exp.exponent.notifications.insecurecheduler;

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
  public void schedule(String experienceId, int elapsedTime, int notificationId, HashMap notification, Context context) {
    mExecutor.execute(() -> insecureScheduler.schedule(experienceId, elapsedTime, notificationId, notification, context));
  }

  @Override
  public void cancelScheduled(String experienceId, int notificationId, Context context) {
    mExecutor.execute(() -> insecureScheduler.cancelScheduled(experienceId, notificationId, context));
  }

  @Override
  public void cancelAllScheduled(String experienceId, Context context) {
    mExecutor.execute(() -> insecureScheduler.cancelAllScheduled(experienceId, context));
  }
}
