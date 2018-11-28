package expo.interfaces.taskManager;

import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Intent;

import java.util.Map;

public interface TaskConsumerInterface {
  /**
   * Returns the type of the task, eg. "location" or "geofencing".
   */
  String taskType();

  /**
   * Called once the task has been registered by the task service.
   */
  void didRegister(TaskInterface task);

  /**
   * Executed once the task associated with the consumer has been unregistered by the task service.
   */
  void didUnregister();

  /**
   * Called when the task service has received a notification from the broadcast.
   */
  void didReceiveBroadcast(Intent intent);

  /**
   * Called when the scheduled job started its execution.
   */
  boolean didExecuteJob(JobService jobService, JobParameters params);

  /**
   * Invoked when the scheduled job has been cancelled by the system.
   */
  boolean didCancelJob(JobService jobService, JobParameters params);

  void setOptions(Map<String, Object> options);
}
