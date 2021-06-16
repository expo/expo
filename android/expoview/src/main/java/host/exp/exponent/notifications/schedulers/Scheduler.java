package host.exp.exponent.notifications.schedulers;

import android.content.Context;

import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.notifications.exceptions.UnableToScheduleException;

public interface Scheduler {

  void schedule(String action) throws UnableToScheduleException;

  String getIdAsString();

  ExperienceKey getOwnerExperienceKey();

  void cancel();

  boolean canBeRescheduled();

  String saveAndGetId();

  void setApplicationContext(Context context);

  void remove();

}
