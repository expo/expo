package expo.modules.notifications.scheduling.schedulers;

import java.util.HashMap;

public interface SchedulerModel {

  long getNextAppearanceTime();

  boolean shouldBeTriggeredByAction(String action);

  String getOwnerAppId();

  int getId();

  String getIdAsString();

  HashMap<String, Object> getDetails();

  boolean canBeRescheduled();

  String saveAndGetId();

  void remove();

}
