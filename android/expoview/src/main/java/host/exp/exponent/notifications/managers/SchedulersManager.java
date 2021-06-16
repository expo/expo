package host.exp.exponent.notifications.managers;

import org.unimodules.core.interfaces.Function;

import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.notifications.schedulers.Scheduler;

public interface SchedulersManager {

  void triggerAll(String action);

  void removeAll(ExperienceKey experienceKey);

  void cancelAlreadyScheduled(ExperienceKey experienceKey);

  void rescheduleOrDelete(String id);

  void removeScheduler(String id);

  void addScheduler(Scheduler scheduler, Function<String, Boolean> handler);

}
