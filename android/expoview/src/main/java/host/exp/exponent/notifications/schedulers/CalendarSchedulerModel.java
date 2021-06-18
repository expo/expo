package host.exp.exponent.notifications.schedulers;

import android.content.Intent;
import android.os.SystemClock;

import com.cronutils.model.Cron;
import com.cronutils.model.definition.CronDefinition;
import com.cronutils.model.time.ExecutionTime;
import com.cronutils.parser.CronParser;
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
import host.exp.exponent.notifications.helpers.ExpoCronDefinitionBuilder;
import host.exp.exponent.notifications.managers.SchedulersManagerProxy;
import host.exp.exponent.notifications.managers.SchedulersDatabase;

@Table(database = SchedulersDatabase.class)
public class CalendarSchedulerModel extends BaseModel implements SchedulerModel {

  private static List<String> triggeringActions = Arrays.asList(null,
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_REBOOT,
      Intent.ACTION_TIME_CHANGED,
      Intent.ACTION_TIMEZONE_CHANGED);

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
  String calendarData;

  // -- scheduler methods --

  @Override
  public String getIdAsString() {
    return Integer.valueOf(id).toString() + this.getClass().getSimpleName();
  }

  @Override
  public ExperienceKey getOwnerExperienceKey() {
    return new ExperienceKey(scopeKey);
  }

  @Override
  public boolean canBeRescheduled() {
    return repeat;
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
  public void remove() {
    delete();
  }

  public long getNextAppearanceTime() { // elapsedTime
    CronDefinition cronDefinition = ExpoCronDefinitionBuilder.getCronDefinition();
    CronParser parser = new CronParser(cronDefinition);
    Cron cron = parser.parse(calendarData);

    DateTime now = DateTime.now();
    DateTime nextExecution = ExecutionTime.forCron(cron).nextExecution(now);
    long whenShouldAppear = nextExecution.toDate().getTime();
    long bootTime = DateTime.now().toDate().getTime() - SystemClock.elapsedRealtime();
    return whenShouldAppear - bootTime;
  }

  @Override
  public boolean shouldBeTriggeredByAction(String action) {
    return CalendarSchedulerModel.triggeringActions.contains(action);
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

  public void setExperienceScopeKey(String scopeKey) {
    this.scopeKey = scopeKey;
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

  public String getCalendarData() {
    return calendarData;
  }

  public void setCalendarData(String calendarData) {
    this.calendarData = calendarData;
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
