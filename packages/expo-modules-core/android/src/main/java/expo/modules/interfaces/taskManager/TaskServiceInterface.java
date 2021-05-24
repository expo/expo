package expo.modules.interfaces.taskManager;

import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Intent;
import android.os.Bundle;

import java.util.List;
import java.util.Map;

import org.unimodules.core.interfaces.SingletonModule;

public interface TaskServiceInterface extends SingletonModule {

  /**
   *  Returns boolean value whether the task with given name is already registered for given appId.
   */
  boolean hasRegisteredTask(String taskName, String appId);

  /**
   *  Registers task in any kind of persistent storage, so it could be restored in future sessions.
   */
  void registerTask(String taskName, String appId, String appUrl, Class consumerClass, Map<String, Object> options) throws Exception;

  /**
   *  Unregisters task with given name and for given appId. If consumer class is provided,
   *  it can throw an exception if task's consumer is not a member of that class.
   */
  void unregisterTask(String taskName, String appId, Class consumerClass) throws Exception;

  /**
   *  Unregisters all tasks registered for the app with given appId.
   */
  void unregisterAllTasksForAppId(String appId);

  /**
   *  Returns boolean value whether or not the task's consumer is a member of given class.
   */
  boolean taskHasConsumerOfClass(String taskName, String appId, Class consumerClass);

  /**
   *  Returns options associated with the task with given name and appId or nil if task not found.
   */
  Bundle getTaskOptions(String taskName, String appId);

  /**
   *  Returns a list of task bundles for given appId.
   */
  List<Bundle> getTasksForAppId(String appId);

  /**
   *  Returns a list of task consumer for given appId.
   */
  List<TaskConsumerInterface> getTaskConsumers(String appId);

  /**
   *  Notifies the service that a task has just finished.
   */
  void notifyTaskFinished(String taskName, String appId, Map<String, Object> response);

  /**
   *  Passes a reference of task manager for given appId and appUrl to the service.
   */
  void setTaskManager(TaskManagerInterface taskManager, String appId, String appUrl);

  /**
   *  Handles intent that just woke up.
   */
  void handleIntent(Intent intent);

  /**
   *  Executed when the scheduled job is about to start.
   */
  boolean handleJob(JobService jobService, JobParameters jobParameters);

  /**
   *  Called when the job has been cancelled by the system.
   */
  boolean cancelJob(JobService jobService, JobParameters jobParameters);

  /**
   *  Executes the task with given data bundle and given error.
   */
  void executeTask(TaskInterface task, Bundle data, Error error, TaskExecutionCallback callback);

  /**
   *  Checks whether the app with given appId is currently being run in headless mode.
   */
  boolean isStartedByHeadlessLoader(String appId);

}
