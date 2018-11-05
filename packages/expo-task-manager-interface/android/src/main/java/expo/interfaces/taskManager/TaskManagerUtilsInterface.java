package expo.interfaces.taskManager;

import android.app.PendingIntent;
import android.app.job.JobInfo;
import android.content.Context;
import android.os.PersistableBundle;

public interface TaskManagerUtilsInterface {
  PendingIntent createTaskIntent(Context context, TaskInterface task);

  void scheduleJob(Context context, JobInfo jobInfoArg);

  void scheduleJob(Context context, TaskInterface task, PersistableBundle extras);
}
