package expo.modules.notifications.scheduling.schedulers;

import android.content.Context;
import expo.modules.notifications.scheduling.schedulers.exceptions.UnableToScheduleException;

public interface Scheduler {

  void schedule(String action) throws UnableToScheduleException;

  String getIdAsString();

  String getOwnerAppId();

  void cancel();

  boolean canBeRescheduled();

  String saveAndGetId();

  void setApplicationContext(Context context);

  void remove();

}
