package versioned.host.exp.exponent.modules.api.notifications;

import android.content.Context;
import android.os.AsyncTask;

import com.facebook.react.bridge.Callback;
import com.facebook.react.fabric.Scheduler;

import org.unimodules.core.interfaces.Function;

public class SchedulersManagerProxy implements SchedulersManagerInterface {

  private volatile static SchedulersManagerInterface instance = null;

  public final static String SCHEDULER_ID = "scheduler_id";

  private SchedulersManagerInterface mSchedulerManager;

  public SchedulersManagerProxy(SchedulersManagerInterface schedulerManager) {
    mSchedulerManager = schedulerManager;
  }

  public static synchronized SchedulersManagerInterface getInstance(Context context) {
    if (instance == null) {
      instance = new SchedulersManagerProxy(new SchedulerManager(context.getApplicationContext()));
    }
    return instance;
  }

  @Override
  public void scheduleAll(final String action) {
    AsyncTask.execute(()->mSchedulerManager.scheduleAll(action));
  }

  @Override
  public void removeAll() {
    AsyncTask.execute(()->removeAll());
  }

  @Override
  public void cancelAlreadyScheduled() {
    AsyncTask.execute(()->cancelAlreadyScheduled());
  }

  @Override
  public void rescheduleOrDelete(final String id) {
    AsyncTask.execute(()->mSchedulerManager.rescheduleOrDelete(id));
  }

  @Override
  public void removeScheduler(final String id) {
    AsyncTask.execute(()->mSchedulerManager.removeScheduler(id));
  }

  @Override
  public void addScheduler(final SchedulerInterface scheduler, final Function<String, Boolean> handler) {
    AsyncTask.execute(()->mSchedulerManager.addScheduler(scheduler, handler));
  }

}
