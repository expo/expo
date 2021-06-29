package host.exp.exponent.notifications.managers;

import android.content.Context;

import com.raizlabs.android.dbflow.sql.language.SQLite;
import com.raizlabs.android.dbflow.sql.language.Select;
import org.unimodules.core.interfaces.Function;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.notifications.exceptions.UnableToScheduleException;
import host.exp.exponent.notifications.schedulers.Scheduler;
import host.exp.exponent.notifications.schedulers.SchedulerModel;
import host.exp.exponent.notifications.schedulers.CalendarSchedulerModel;
import host.exp.exponent.notifications.schedulers.IntervalSchedulerModel;
import host.exp.exponent.notifications.schedulers.SchedulerImpl;

class SchedulerManagerImpl implements SchedulersManager {

  private boolean mFetchedFromDB = false;

  private HashMap<String, Scheduler> mSchedulersMap = new HashMap<>();

  private Context mApplicationContext;

  SchedulerManagerImpl(Context applicationContext) {
    mApplicationContext = applicationContext;
  }

  @Override
  public void triggerAll(String action) {
    fetchSchedulersMap();

    cancelAlreadyScheduled(null);

    ArrayList<String> unsuccessful = new ArrayList<String>();

    for (Map.Entry<String, Scheduler> scheduler : mSchedulersMap.entrySet()) {
      try {
        scheduler.getValue().schedule(action);
      } catch (UnableToScheduleException e) {
        unsuccessful.add(scheduler.getKey());
      }
    }

    for (String key : unsuccessful) {
      this.removeScheduler(key);
    }
  }

  @Override
  public void removeAll(ExperienceKey experienceKey) {
    fetchSchedulersMap();
    cancelAlreadyScheduled(experienceKey);

    ArrayList<String> toRemove = new ArrayList<String>();

    for (Map.Entry<String, Scheduler> scheduler : mSchedulersMap.entrySet()) {
      if (experienceKey == null || scheduler.getValue().getOwnerExperienceKey().equals(experienceKey)) {
        scheduler.getValue().remove();
        toRemove.add(scheduler.getKey());
      }
    }

    for (String key : toRemove) {
      mSchedulersMap.remove(key);
    }
  }

  @Override
  public void cancelAlreadyScheduled(ExperienceKey experienceKey) {
    fetchSchedulersMap();
    for (Scheduler scheduler : mSchedulersMap.values()) {
      if (experienceKey == null || scheduler.getOwnerExperienceKey().equals(experienceKey)) {
        scheduler.cancel();
      }
    }
  }

  @Override
  public void rescheduleOrDelete(String id) {
    fetchSchedulersMap();
    Scheduler scheduler = mSchedulersMap.get(id);
    if (scheduler == null) {
      return;
    }

    if (!scheduler.canBeRescheduled()) {
      this.removeScheduler(id);
    } else {
      try {
        scheduler.schedule(null);
      } catch (UnableToScheduleException e) {
        this.removeScheduler(id);
      }
    }
  }

  @Override
  public void removeScheduler(String id) {
    fetchSchedulersMap();
    Scheduler scheduler = mSchedulersMap.get(id);
    if (scheduler == null) {
      return;
    }
    mSchedulersMap.remove(id);
    scheduler.cancel();
    scheduler.remove();
  }

  @Override
  public void addScheduler(Scheduler scheduler, Function<String, Boolean> handler) {
    fetchSchedulersMap();

    scheduler.setApplicationContext(mApplicationContext);
    String id = scheduler.saveAndGetId();
    mSchedulersMap.put(id, scheduler);
    try {
      scheduler.schedule(null);
    } catch (UnableToScheduleException e) {
      this.removeScheduler(id);
      id = null;
    }
    handler.apply(id);
  }

  private List<Class> getSchedulerClasses() {
    return Arrays.asList(CalendarSchedulerModel.class, IntervalSchedulerModel.class);
  }

  private void fetchSchedulersMap() {
    if (!mFetchedFromDB) {
      mFetchedFromDB = true;

      for (Class schedulerClass : getSchedulerClasses()) {
        List<SchedulerModel> schedulers = SQLite.select().from(schedulerClass).queryList();
        for (SchedulerModel schedulerModel : schedulers) {
          SchedulerImpl scheduler = new SchedulerImpl(schedulerModel);
          mSchedulersMap.put(scheduler.getIdAsString(), scheduler);
        }
      }

      for (Scheduler scheduler : mSchedulersMap.values()) {
        scheduler.setApplicationContext(mApplicationContext);
      }
    }
  }

}
