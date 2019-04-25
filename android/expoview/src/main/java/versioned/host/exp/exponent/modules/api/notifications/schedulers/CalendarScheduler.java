package versioned.host.exp.exponent.modules.api.notifications.schedulers;

import android.content.Context;
import android.content.Intent;
import android.os.SystemClock;

import com.cronutils.model.Cron;
import com.cronutils.model.definition.CronDefinition;
import com.cronutils.model.definition.CronDefinitionBuilder;
import com.cronutils.model.time.ExecutionTime;
import com.cronutils.parser.CronParser;
import com.raizlabs.android.dbflow.annotation.Column;
import com.raizlabs.android.dbflow.annotation.PrimaryKey;
import com.raizlabs.android.dbflow.annotation.Table;
import com.raizlabs.android.dbflow.structure.BaseModel;

import org.joda.time.DateTime;
import org.json.JSONException;
import org.unimodules.core.InvalidArgumentException;

import java.io.IOException;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;

import host.exp.exponent.notifications.ExponentNotificationManager;
import versioned.host.exp.exponent.modules.api.notifications.SchedulerInterface;
import versioned.host.exp.exponent.modules.api.notifications.SchedulersDatabase;

import static com.cronutils.model.CronType.QUARTZ;

@Table(database = SchedulersDatabase.class)
public class CalendarScheduler extends BaseModel implements SchedulerInterface {

  private ArrayList<String> mTriggeringActions = (ArrayList<String>) Arrays.asList(null,
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_TIME_CHANGED,
      Intent.ACTION_TIMEZONE_CHANGED);

  private Context mApplicationContext;

  // -- model fields and methods --

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

  HashMap<String, Object> details;

  @Column
  String calendarData;

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
    return repeat || (!scheduled);
  }

  @Override
  public void scheduled() {
    this.scheduled = true;
    save();
  }

  @Override
  public int saveAndGetId() {
    save();
    return id;
  }

  @Override
  public void remove() {
    cancel();
    delete();
  }

  private long getNextAppearanceTime() { // elapsedTime
    CronDefinition cronDefinition = CronDefinitionBuilder.instanceDefinitionFor(QUARTZ);
    CronParser parser = new CronParser(cronDefinition);
    Cron cron = parser.parse(calendarData);

    DateTime now = DateTime.now();
    DateTime nextExecution = ExecutionTime.forCron(cron).nextExecution(now);
    long whenShouldAppear = nextExecution.toDate().getTime();
    long bootTime = DateTime.now().toDate().getTime() - SystemClock.elapsedRealtime();
    return whenShouldAppear-bootTime;
  }

  private ExponentNotificationManager getManager() {
    return new ExponentNotificationManager(mApplicationContext);
  }

}
