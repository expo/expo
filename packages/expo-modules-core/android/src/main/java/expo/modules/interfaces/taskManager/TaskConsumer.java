package expo.modules.interfaces.taskManager;

import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Context;
import android.content.Intent;

import java.lang.ref.WeakReference;
import java.util.Map;

import expo.modules.core.interfaces.DoNotStrip;

public abstract class TaskConsumer implements TaskConsumerInterface {
  /**
   *  Version of the consumer. Increase this number in case of any breaking changes made to the task consumer,
   *  so the existing tasks will be automatically unregistered when the native code gets upgraded.
   */
  @DoNotStrip
  public static int VERSION = 0;

  private WeakReference<Context> mContextRef;
  private TaskManagerUtilsInterface mTaskManagerUtils;

  public TaskConsumer(Context context, TaskManagerUtilsInterface taskManagerUtils) {
    mContextRef = new WeakReference<>(context);
    mTaskManagerUtils = taskManagerUtils;
  }

  protected Context getContext() {
    return mContextRef != null ? mContextRef.get() : null;
  }

  protected TaskManagerUtilsInterface getTaskManagerUtils() {
    return mTaskManagerUtils;
  }

  //region TaskConsumerInterface

  public void didReceiveBroadcast(Intent intent) {
    // nothing
  }

  public boolean didExecuteJob(JobService jobService, JobParameters params) {
    return false;
  }

  public boolean didCancelJob(JobService jobService, JobParameters params) {
    return false;
  }

  public void setOptions(Map<String, Object> options) {
    // nothing
  }

  public boolean canReceiveCustomBroadcast(String action) {
    // Override it if you want your task consumer to receive custom broadcast like `Intent.ACTION_BOOT_COMPLETED`.
    return false;
  }

  //endregion
}
