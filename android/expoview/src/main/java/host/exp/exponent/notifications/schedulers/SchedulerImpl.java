package host.exp.exponent.notifications.schedulers;

import android.content.Context;

import java.util.HashMap;

import host.exp.exponent.notifications.ExponentNotificationManager;
import host.exp.exponent.notifications.exceptions.UnableToScheduleException;

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

    String experienceId = mSchedulerModel.getOwnerExperienceId();
    int notificationId = mSchedulerModel.getNotificationId();
    HashMap<String, Object> details = mSchedulerModel.getDetails();

    try {
      getManager().schedule(experienceId, notificationId, details, nextAppearanceTime, null);
    } catch (ClassNotFoundException e) {
      e.printStackTrace();
    }
  }

  @Override
  public String getIdAsString() {
    return mSchedulerModel.getIdAsString();
  }

  @Override
  public String getOwnerExperienceId() {
    return mSchedulerModel.getOwnerExperienceId();
  }

  @Override
  public void cancel() {
    String experienceId = mSchedulerModel.getOwnerExperienceId();
    int notificationId = mSchedulerModel.getNotificationId();
    getManager().cancel(experienceId, notificationId);
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

  private ExponentNotificationManager getManager() {
    return new ExponentNotificationManager(mApplicationContext);
  }
}
