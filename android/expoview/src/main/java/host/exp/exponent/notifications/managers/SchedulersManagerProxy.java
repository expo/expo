package host.exp.exponent.notifications.managers;

import android.content.Context;

import org.unimodules.core.interfaces.Function;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.notifications.schedulers.Scheduler;

public class SchedulersManagerProxy implements SchedulersManager {

  private volatile static SchedulersManager instance = null;

  public final static String SCHEDULER_ID = "scheduler_id";

  private SchedulersManager mSchedulersManager;

  private Executor mSingleThreadExecutor = Executors.newSingleThreadExecutor();

  private SchedulersManagerProxy(SchedulersManager schedulerManager) {
    mSchedulersManager = schedulerManager;
  }

  public static synchronized SchedulersManager getInstance(Context context) {
    if (instance == null) {
      instance = new SchedulersManagerProxy(new SchedulerManagerImpl(context.getApplicationContext()));
    }
    return instance;
  }

  @Override
  public void triggerAll(final String action) {
    mSingleThreadExecutor.execute(()-> mSchedulersManager.triggerAll(action));
  }

  @Override
  public void removeAll(ExperienceKey experienceKey) {
    mSingleThreadExecutor.execute(()-> mSchedulersManager.removeAll(experienceKey));
  }

  @Override
  public void cancelAlreadyScheduled(ExperienceKey experienceKey) {
    mSingleThreadExecutor.execute(()-> mSchedulersManager.cancelAlreadyScheduled(experienceKey));
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
  public void addScheduler(final Scheduler scheduler, final Function<String, Boolean> handler) {
    mSingleThreadExecutor.execute(()-> mSchedulersManager.addScheduler(scheduler, handler));
  }

}
