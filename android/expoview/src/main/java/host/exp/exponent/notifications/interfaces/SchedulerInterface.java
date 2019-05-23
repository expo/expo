package host.exp.exponent.notifications.interfaces;

import android.content.Context;
import host.exp.exponent.notifications.exceptions.UnableToScheduleException;

public interface SchedulerInterface {

  public void schedule(String action) throws UnableToScheduleException;

  public String getIdAsString();

  public String getOwnerExperienceId();

  public void cancel();

  public boolean canBeRescheduled();

  public String saveAndGetId();

  public void setApplicationContext(Context context);

  public void remove();

}
