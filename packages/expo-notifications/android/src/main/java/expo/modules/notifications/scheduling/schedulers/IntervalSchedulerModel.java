package expo.modules.notifications.scheduling.schedulers;

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
import java.util.Random;

import expo.modules.notifications.helpers.HashMapSerializer;
import expo.modules.notifications.scheduling.managers.SchedulersManagerProxy;
import expo.modules.notifications.scheduling.managers.SchedulersDatabase;

@Table(databaseName = SchedulersDatabase.NAME)
public class IntervalSchedulerModel extends BaseModel implements SchedulerModel {

  private static List<String> triggeringActions = Arrays.asList(null,
      Intent.ACTION_REBOOT,
      Intent.ACTION_BOOT_COMPLETED);

  private HashMap<String, Object> details;

  // -- model fields --

  @Column
  @PrimaryKey
  int id;

  @Column
  String appId;

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
    this.id = Math.abs(new Random().nextInt(Integer.MAX_VALUE));
    details.put(SchedulersManagerProxy.SCHEDULER_ID, getIdAsString());
    setDetails(details);
    save();
    return getIdAsString();
  }

  @Override
  public String getOwnerAppId() {
    return appId;
  }

  @Override
  public String getIdAsString() {
    return Integer.valueOf(id).toString();
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

  public String getappId() {
    return appId;
  }

  public void setappId(String appId) {
    this.appId = appId;
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
    details = HashMapSerializer.deserialize(serializedDetails);
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
