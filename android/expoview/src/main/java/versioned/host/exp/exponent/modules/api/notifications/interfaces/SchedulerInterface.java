package versioned.host.exp.exponent.modules.api.notifications.interfaces;

import android.content.Context;
import android.content.Intent;

public interface SchedulerInterface {

  public boolean schedule(String action); // return false if not successful

  public String getIdAsString();

  public void cancel();

  public boolean canBeRescheduled();

  public void onPostSchedule();

  public String saveAndGetId();

  public void setApplicationContext(Context context);

  public void remove();

}
