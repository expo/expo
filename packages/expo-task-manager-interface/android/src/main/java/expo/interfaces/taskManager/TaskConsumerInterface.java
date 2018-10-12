package expo.interfaces.taskManager;

import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Intent;

import java.util.Map;

public interface TaskConsumerInterface {
  void didRegister(TaskInterface task);

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
