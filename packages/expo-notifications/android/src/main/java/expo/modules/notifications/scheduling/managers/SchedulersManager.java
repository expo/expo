package expo.modules.notifications.scheduling.managers;

import org.unimodules.core.interfaces.Function;

import expo.modules.notifications.scheduling.schedulers.Scheduler;

public interface SchedulersManager {

  void triggerAll(String action);

  void removeAll(String appId);

  void cancelAlreadyScheduled(String appId);

  void rescheduleOrDelete(String id);

  void removeScheduler(String id);

  void addScheduler(Scheduler scheduler, Function<String, Boolean> handler);

}
