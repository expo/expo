package host.exp.exponent.notifications.schedulers;

import android.content.Context;
import android.content.Intent;
import android.os.SystemClock;

import com.raizlabs.android.dbflow.annotation.Column;
import com.raizlabs.android.dbflow.annotation.PrimaryKey;
import com.raizlabs.android.dbflow.annotation.Table;
import com.raizlabs.android.dbflow.structure.BaseModel;

import org.joda.time.DateTime;
import org.json.JSONException;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.notifications.managers.SchedulersManagerProxy;
import host.exp.exponent.notifications.managers.SchedulersDatabase;

@Table(database = SchedulersDatabase.class)
public class IntervalSchedulerModel extends BaseModel implements SchedulerModel {

  private static List<String> triggeringActions = Arrays.asList(null,
      Intent.ACTION_REBOOT,
      Intent.ACTION_BOOT_COMPLETED);

  private Context mApplicationContext;

  private HashMap<String, Object> details;

  // -- model fields --

  @Column
  @PrimaryKey(autoincrement = true)
  int id;

  @Column
  int notificationId;

  @Column(name = "experienceId")
  String scopeKey;

  @Column
  boolean repeat;

  @Column
  String serializedDetails;

  @Column
  long scheduledTime;

  @Column
  long interval;

  // -- scheduler methods --

  @Override
  public boolean canBeRescheduled() {
    return repeat || (DateTime.now().toDate().getTime() < scheduledTime);
  }

  @Override
  public String saveAndGetId() {
    save(); // get id from database
    details.put(SchedulersManagerProxy.SCHEDULER_ID, getIdAsString());
    setDetails(details);
    save();
    return getIdAsString();
  }

  @Override
  public ExperienceKey getOwnerExperienceKey() {
    return new ExperienceKey(scopeKey);
  }

  @Override
  public String getIdAsString() {
    return Integer.valueOf(id).toString() + this.getClass().getSimpleName();
  }

  @Override
  public void remove() {
    delete();
  }

  public long getNextAppearanceTime() { // elapsedTime
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

  @Override
  public boolean shouldBeTriggeredByAction(String action) {
    return IntervalSchedulerModel.triggeringActions.contains(action);
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

  public String getExperienceScopeKey() {
    return scopeKey;
  }

  public void setExperienceScopeKey(String experienceScopeKey) {
    this.scopeKey = experienceScopeKey;
  }

  public boolean isRepeat() {
    return repeat;
  }

  public void setRepeat(boolean repeat) {
    this.repeat = repeat;
  }

  public String getSerializedDetails() {
    return serializedDetails;
  }

  public void setSerializedDetails(String serializedDetails) {
    try {
      details = HashMapSerializer.deserialize(serializedDetails);
    } catch (JSONException e) {
      e.printStackTrace();
    }
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
    setSerializedDetails(this.serializedDetails);
    return details;
  }

  public void setDetails(HashMap<String, Object> details) {
    this.details = details;
    serializedDetails = HashMapSerializer.serialize(details);
  }
}
