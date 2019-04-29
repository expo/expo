package versioned.host.exp.exponent.modules.api.notifications;

import android.content.Context;
import android.os.AsyncTask;

import org.unimodules.core.interfaces.Function;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import versioned.host.exp.exponent.modules.api.notifications.interfaces.SchedulerInterface;
import versioned.host.exp.exponent.modules.api.notifications.interfaces.SchedulersManagerInterface;

public class SchedulersManagerProxy implements SchedulersManagerInterface {

  private volatile static SchedulersManagerInterface instance = null;

  public final static String SCHEDULER_ID = "scheduler_id";

  private SchedulersManagerInterface mSchedulerManager;

  private Executor mSingleThreadExecutor = Executors.newSingleThreadExecutor();

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
    mSingleThreadExecutor.execute(()->mSchedulerManager.scheduleAll(action));
  }

  @Override
  public void removeAll() {
    mSingleThreadExecutor.execute(()->mSchedulerManager.removeAll());
  }

  @Override
  public void cancelAlreadyScheduled() {
    mSingleThreadExecutor.execute(()->mSchedulerManager.cancelAlreadyScheduled());
  }

  @Override
  public void rescheduleOrDelete(final String id) {
    mSingleThreadExecutor.execute(()->mSchedulerManager.rescheduleOrDelete(id));
  }

  @Override
  public void removeScheduler(final String id) {
    mSingleThreadExecutor.execute(()->mSchedulerManager.removeScheduler(id));
  }

  @Override
  public void addScheduler(final SchedulerInterface scheduler, final Function<String, Boolean> handler) {
    mSingleThreadExecutor.execute(()->mSchedulerManager.addScheduler(scheduler, handler));
  }

}
