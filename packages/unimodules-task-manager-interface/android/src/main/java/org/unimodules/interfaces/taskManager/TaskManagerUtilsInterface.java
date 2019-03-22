package org.unimodules.interfaces.taskManager;

import android.app.PendingIntent;
import android.app.job.JobInfo;
import android.content.Context;
import android.os.PersistableBundle;

public interface TaskManagerUtilsInterface {
  /**
   * Creates pending intent that represents the task containing all its params.
   */
  PendingIntent createTaskIntent(Context context, TaskInterface task);

  /**
   * Cancels pending intent for given task.
   */
  void cancelTaskIntent(Context context, String appId, String taskName);

  /**
   * Schedules a job with customizable job info param.
   */
  void scheduleJob(Context context, JobInfo jobInfoArg);

  /**
   * Schedules a job for given task and with given extra data.
   */
  void scheduleJob(Context context, TaskInterface task, PersistableBundle extras);
}
