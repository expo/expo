package versioned.host.exp.exponent.modules.api.notifications.interfaces;

import org.unimodules.core.interfaces.Function;

public interface SchedulersManagerInterface {

  public void scheduleAll(String action);

  public void removeAll();

  public void cancelAlreadyScheduled();

  public void rescheduleOrDelete(String id);

  public void removeScheduler(String id);

  public void addScheduler(SchedulerInterface scheduler, Function<String, Boolean> handler);

}
