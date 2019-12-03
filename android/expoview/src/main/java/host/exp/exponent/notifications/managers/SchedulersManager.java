package host.exp.exponent.notifications.managers;

import org.unimodules.core.interfaces.Function;

import host.exp.exponent.notifications.schedulers.Scheduler;

public interface SchedulersManager {

  void triggerAll(String action);

  void removeAll(String experienceId);

  void cancelAlreadyScheduled(String experienceId);

  void rescheduleOrDelete(String id);

  void removeScheduler(String id);

  void addScheduler(Scheduler scheduler, Function<String, Boolean> handler);

}
