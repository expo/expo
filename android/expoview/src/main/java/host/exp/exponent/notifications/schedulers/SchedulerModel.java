package host.exp.exponent.notifications.schedulers;

import java.util.HashMap;

public interface SchedulerModel {

  long getNextAppearanceTime();

  boolean shouldBeTriggeredByAction(String action);

  String getOwnerExperienceId();

  int getNotificationId();

  String getIdAsString();

  HashMap<String, Object> getDetails();

  boolean canBeRescheduled();

  String saveAndGetId();

  void remove();

}
