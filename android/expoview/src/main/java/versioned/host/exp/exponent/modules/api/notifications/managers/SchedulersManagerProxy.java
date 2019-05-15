package versioned.host.exp.exponent.modules.api.notifications.managers;

import android.content.Context;

import org.unimodules.core.interfaces.Function;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import versioned.host.exp.exponent.modules.api.notifications.interfaces.SchedulerInterface;
import versioned.host.exp.exponent.modules.api.notifications.interfaces.SchedulersManagerInterface;

public class SchedulersManagerProxy implements SchedulersManagerInterface {

  private volatile static SchedulersManagerInterface instance = null;

  public final static String SCHEDULER_ID = "scheduler_id";

  private SchedulersManagerInterface mSchedulersManager;

  private Executor mSingleThreadExecutor = Executors.newSingleThreadExecutor();

  private SchedulersManagerProxy(SchedulersManagerInterface schedulerManager) {
    mSchedulersManager = schedulerManager;
  }

  public static synchronized SchedulersManagerInterface getInstance(Context context) {
    if (instance == null) {
      instance = new SchedulersManagerProxy(new SchedulerManager(context.getApplicationContext()));
    }
    return instance;
  }

  @Override
  public void scheduleAll(final String action) {
    mSingleThreadExecutor.execute(()-> mSchedulersManager.scheduleAll(action));
  }

  @Override
  public void removeAll() {
    mSingleThreadExecutor.execute(()-> mSchedulersManager.removeAll());
  }

  @Override
  public void cancelAlreadyScheduled() {
    mSingleThreadExecutor.execute(()-> mSchedulersManager.cancelAlreadyScheduled());
  }

  @Override
  public void rescheduleOrDelete(final String id) {
    mSingleThreadExecutor.execute(()-> mSchedulersManager.rescheduleOrDelete(id));
  }

  @Override
  public void removeScheduler(final String id) {
    mSingleThreadExecutor.execute(()-> mSchedulersManager.removeScheduler(id));
  }

  @Override
  public void addScheduler(final SchedulerInterface scheduler, final Function<String, Boolean> handler) {
    mSingleThreadExecutor.execute(()-> mSchedulersManager.addScheduler(scheduler, handler));
  }

}
