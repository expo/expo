package host.exp.exponent.notifications.interfaces;

import org.unimodules.core.interfaces.Function;

public interface SchedulersManagerInterface {

  void triggerAll(String action);

  void removeAll(String experienceId);

  void cancelAlreadyScheduled(String experienceId);

  void rescheduleOrDelete(String id);

  void removeScheduler(String id);

  void addScheduler(SchedulerInterface scheduler, Function<String, Boolean> handler);

}
