package org.unimodules.interfaces.taskManager;

import android.app.PendingIntent;
import android.app.job.JobParameters;
import android.content.Context;
import android.os.PersistableBundle;

import java.util.List;

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
   * Schedules a job for given task and with given list of extra data.
   */
  void scheduleJob(Context context, TaskInterface task, List<PersistableBundle> data);

  /**
   * Cancels scheduled job with given identifier.
   */
  void cancelScheduledJob(Context context, int jobId);

  /**
   * Extracts data list from job parameters.
   */
  List<PersistableBundle> extractDataFromJobParams(JobParameters params);
}
