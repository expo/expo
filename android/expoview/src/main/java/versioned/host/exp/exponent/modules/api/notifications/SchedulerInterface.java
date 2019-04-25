package versioned.host.exp.exponent.modules.api.notifications;

import android.content.Context;
import android.content.Intent;

public interface SchedulerInterface {

  public boolean schedule(String action); // return false if not successful

  public void cancel();

  public boolean canBeRescheduled();

  public void scheduled();

  public int saveAndGetId();

  public void setApplicationContext(Context context);

  public void remove();

}
