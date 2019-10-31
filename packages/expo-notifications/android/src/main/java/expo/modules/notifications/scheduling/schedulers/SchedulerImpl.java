package expo.modules.notifications.scheduling.schedulers;

import android.content.Context;

import java.util.HashMap;

import expo.modules.notifications.scheduling.schedulers.exceptions.UnableToScheduleException;
import expo.modules.notifications.scheduling.insecurescheduler.ThreadSafeInsecureScheduler;

public class SchedulerImpl implements Scheduler {

  private SchedulerModel mSchedulerModel;

  private Context mApplicationContext;

  public SchedulerImpl(SchedulerModel schedulerModel) {
    this.mSchedulerModel = schedulerModel;
  }

  @Override
  public void schedule(String action) throws UnableToScheduleException {
    if (!mSchedulerModel.shouldBeTriggeredByAction(action)) {
      return;
    }
    long nextAppearanceTime = 0;

    try {
      nextAppearanceTime = mSchedulerModel.getNextAppearanceTime();
    } catch (IllegalArgumentException e) {
      throw new UnableToScheduleException();
    }

    String appId = mSchedulerModel.getOwnerAppId();
    int notificationId = mSchedulerModel.getId();
    HashMap<String, Object> details = mSchedulerModel.getDetails();

    ThreadSafeInsecureScheduler.getInstance().schedule(appId, nextAppearanceTime, notificationId, details, mApplicationContext);
  }

  @Override
  public String getIdAsString() {
    return mSchedulerModel.getIdAsString();
  }

  @Override
  public String getOwnerAppId() {
    return mSchedulerModel.getOwnerAppId();
  }

  @Override
  public void cancel() {
    String appId = mSchedulerModel.getOwnerAppId();
    int notificationId = mSchedulerModel.getId();
    ThreadSafeInsecureScheduler.getInstance().cancelScheduled(appId, notificationId, mApplicationContext);
  }

  @Override
  public boolean canBeRescheduled() {
    return mSchedulerModel.canBeRescheduled();
  }

  @Override
  public String saveAndGetId() {
    return mSchedulerModel.saveAndGetId();
  }

  @Override
  public void setApplicationContext(Context context) {
    mApplicationContext = context.getApplicationContext();
  }

  @Override
  public void remove() {
    cancel();
    mSchedulerModel.remove();
  }

}
