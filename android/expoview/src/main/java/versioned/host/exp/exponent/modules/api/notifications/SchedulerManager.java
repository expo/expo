package versioned.host.exp.exponent.modules.api.notifications;

import android.content.Context;

import com.facebook.react.fabric.Scheduler;

import org.unimodules.core.interfaces.Function;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

class SchedulerManager implements SchedulersManagerInterface {

  private boolean mFetchedFromDB = false;

  private HashMap<String, SchedulerInterface> mSchedulersMap = new HashMap<>();

  private Context mApplicationContext;

  public SchedulerManager(Context applicationContext) {
    mApplicationContext = applicationContext;
  }

  @Override
  public synchronized void scheduleAll(String action) {
    fetchSchedulersMap();

    ArrayList<String> unsuccessful = new ArrayList<String>();

    for (Map.Entry<String, SchedulerInterface> scheduler : mSchedulersMap.entrySet()) {
      boolean success = scheduler.getValue().schedule(action);
      if (!success) {
        unsuccessful.add(scheduler.getKey());
      }
    }

    for (String key : unsuccessful) {
      this.removeScheduler(key);
    }
  }

  @Override
  public synchronized void removeAll() {
    fetchSchedulersMap();
    cancelAlreadyScheduled();
    // remove all from db
  }

  @Override
  public void cancelAlreadyScheduled() {
    fetchSchedulersMap();
    for (SchedulerInterface scheduler : mSchedulersMap.values()) {
      scheduler.cancel();
    }
  }

  @Override
  public synchronized void rescheduleOrDelete(String id) {
    fetchSchedulersMap();
    SchedulerInterface scheduler = mSchedulersMap.get(id);
    if (scheduler == null) {
      return;
    }

    scheduler.scheduled();
    if (!scheduler.canBeRescheduled()) {
      this.removeScheduler(id);
    } else {
      scheduler.schedule(null);
    }
  }

  @Override
  public synchronized void removeScheduler(String id) {
    fetchSchedulersMap();
    SchedulerInterface scheduler = mSchedulersMap.get(id);
    if (scheduler == null) {
      return;
    }
    mSchedulersMap.remove(id);
    scheduler.cancel();
    scheduler.remove();
  }

  @Override
  public synchronized void addScheduler(SchedulerInterface scheduler, Function<String, Boolean> handler) {
    fetchSchedulersMap();

    String id = Integer.valueOf(scheduler.saveAndGetId()).toString();
    mSchedulersMap.put(id, scheduler);
  }

  private void fetchSchedulersMap() {
    if (!mFetchedFromDB) {
      mFetchedFromDB = true;
      // fetch from db
      for (SchedulerInterface scheduler : mSchedulersMap.values()) {
        scheduler.setApplicationContext(mApplicationContext);
      }
    }
  }

}
