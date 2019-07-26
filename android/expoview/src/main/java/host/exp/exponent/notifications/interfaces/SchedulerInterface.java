package host.exp.exponent.notifications.interfaces;

import android.content.Context;
import host.exp.exponent.notifications.exceptions.UnableToScheduleException;

public interface SchedulerInterface {

  void schedule(String action) throws UnableToScheduleException;

  String getIdAsString();

  String getOwnerExperienceId();

  void cancel();

  boolean canBeRescheduled();

  String saveAndGetId();

  void setApplicationContext(Context context);

  void remove();

}
