package versioned.host.exp.exponent.modules.api.notifications.schedulers;

import android.content.Context;
import android.content.Intent;
import android.os.SystemClock;

import com.raizlabs.android.dbflow.annotation.Column;
import com.raizlabs.android.dbflow.annotation.PrimaryKey;
import com.raizlabs.android.dbflow.annotation.Table;
import com.raizlabs.android.dbflow.structure.BaseModel;

import org.joda.time.DateTime;
import org.json.JSONException;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import host.exp.exponent.notifications.ExponentNotificationManager;
import versioned.host.exp.exponent.modules.api.notifications.SchedulersManagerProxy;
import versioned.host.exp.exponent.modules.api.notifications.interfaces.SchedulerInterface;
import versioned.host.exp.exponent.modules.api.notifications.SchedulersDatabase;

@Table(databaseName = SchedulersDatabase.NAME)
public class TimeScheduler extends BaseModel implements SchedulerInterface {

  private List<String> mTriggeringActions = Arrays.asList(null,
      Intent.ACTION_REBOOT,
      Intent.ACTION_BOOT_COMPLETED);

  private Context mApplicationContext;

  public HashMap<String, Object> details;

  // -- model fields --

  @Column
  @PrimaryKey
  int id;

  @Column
  int notificationId;

  @Column
  String experienceId;

  @Column
  boolean repeat;

  @Column
  boolean scheduled = false;

  @Column
  String serializedDetails;

  @Column
  long scheduledTime;

  @Column
  long interval;

  // -- scheduler methods --

  @Override
  public void setApplicationContext(Context context) {
    mApplicationContext = context.getApplicationContext();
  }

  @Override
  public boolean schedule(String action) {
    if (!mTriggeringActions.contains(action)) {
      return true;
    }
    long nextAppearanceTime = 0;

    try {
      nextAppearanceTime = getNextAppearanceTime();
    } catch (IllegalArgumentException e) {
      return false;
    }

    ensureDetails();
    try {
      getManager().schedule(experienceId, notificationId, details, nextAppearanceTime, null);
    } catch (ClassNotFoundException e) {
      e.printStackTrace();
      return false;
    }
    return true;
  }

  private void ensureDetails() {
    try {
      details = HashMapSerializer.deserialize(serializedDetails);
    } catch (JSONException e) {
      e.printStackTrace();
    }
  }

  @Override
  public void cancel() {
    getManager().cancel(experienceId, notificationId);
  }

  @Override
  public boolean canBeRescheduled() {
    return repeat || (DateTime.now().toDate().getTime() < scheduledTime);
  }

  @Override
  public void scheduled() {
    this.scheduled = true;
    save();
  }

  @Override
  public String saveAndGetId() {
    details.put(SchedulersManagerProxy.SCHEDULER_ID, getIdAsString());
    setDetails(details);
    save();
    return getIdAsString();
  }

  @Override
  public String getIdAsString() {
    return Integer.valueOf(id).toString();
  }

  @Override
  public void remove() {
    cancel();
    delete();
  }

  private long getNextAppearanceTime() { // elapsedTime
    // time when notification should be presented can be represented as (interval * t + scheduledTime)

    long now = DateTime.now().toDate().getTime();
    long whenShouldAppear = -1;
    if (now <= scheduledTime) {
      whenShouldAppear =  scheduledTime;
    } else {

      if (interval <= 0) {
        throw new IllegalArgumentException();
      }

      now  = DateTime.now().toDate().getTime();
      long elapsedTime = (now - scheduledTime);
      long t = elapsedTime / interval + 1;
      whenShouldAppear = interval * t + scheduledTime;
    }

    long bootTime = DateTime.now().toDate().getTime() - SystemClock.elapsedRealtime();
    return whenShouldAppear-bootTime;
  }

  private ExponentNotificationManager getManager() {
    return new ExponentNotificationManager(mApplicationContext);
  }

  // model getters and setters

  public int getId() {
    return id;
  }

  public void setId(int id) {
    this.id = id;
  }

  public int getNotificationId() {
    return notificationId;
  }

  public void setNotificationId(int notificationId) {
    this.notificationId = notificationId;
  }

  public String getExperienceId() {
    return experienceId;
  }

  public void setExperienceId(String experienceId) {
    this.experienceId = experienceId;
  }

  public boolean isRepeat() {
    return repeat;
  }

  public void setRepeat(boolean repeat) {
    this.repeat = repeat;
  }

  public boolean isScheduled() {
    return scheduled;
  }

  public void setScheduled(boolean scheduled) {
    this.scheduled = scheduled;
  }

  public String getSerializedDetails() {
    return serializedDetails;
  }

  public void setSerializedDetails(String serializedDetails) {
    this.serializedDetails = serializedDetails;
  }

  public long getScheduledTime() {
    return scheduledTime;
  }

  public void setScheduledTime(long time) {
    this.scheduledTime = time;
  }

  public long getInterval() {
    return interval;
  }

  public void setInterval(long time) {
    this.interval = time;
  }

  public HashMap<String, Object> getDetails() {
    return details;
  }

  public void setDetails(HashMap<String, Object> details) {
    this.details = details;
    serializedDetails = HashMapSerializer.serialize(details);
  }
}
