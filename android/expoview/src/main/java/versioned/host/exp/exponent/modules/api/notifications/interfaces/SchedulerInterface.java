package versioned.host.exp.exponent.modules.api.notifications.interfaces;

import android.content.Context;
import versioned.host.exp.exponent.modules.api.notifications.exceptions.UnableToScheduleException;

public interface SchedulerInterface {

  public void schedule(String action) throws UnableToScheduleException; // return false if not successful

  public String getIdAsString();

  public void cancel();

  public boolean canBeRescheduled();

  public void onPostSchedule();

  public String saveAndGetId();

  public void setApplicationContext(Context context);

  public void remove();

}
