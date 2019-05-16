package host.exp.exponent.notifications.managers;

import android.content.Context;

import org.unimodules.core.interfaces.Function;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import host.exp.exponent.notifications.interfaces.SchedulerInterface;
import host.exp.exponent.notifications.interfaces.SchedulersManagerInterface;

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
  public void triggerAll(final String action) {
    mSingleThreadExecutor.execute(()-> mSchedulersManager.triggerAll(action));
  }

  @Override
  public void removeAll(String experienceId) {
    mSingleThreadExecutor.execute(()-> mSchedulersManager.removeAll(experienceId));
  }

  @Override
  public void cancelAlreadyScheduled(String experienceId) {
    mSingleThreadExecutor.execute(()-> mSchedulersManager.cancelAlreadyScheduled(experienceId));
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
