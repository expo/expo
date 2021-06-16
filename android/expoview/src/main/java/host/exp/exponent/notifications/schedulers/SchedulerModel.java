package host.exp.exponent.notifications.schedulers;

import java.util.HashMap;

import host.exp.exponent.kernel.ExperienceKey;

public interface SchedulerModel {

  long getNextAppearanceTime();

  boolean shouldBeTriggeredByAction(String action);

  ExperienceKey getOwnerExperienceKey();

  int getNotificationId();

  String getIdAsString();

  HashMap<String, Object> getDetails();

  boolean canBeRescheduled();

  String saveAndGetId();

  void remove();

}
