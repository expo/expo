package expo.interfaces.taskManager;

import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Context;
import android.content.Intent;

import java.lang.ref.WeakReference;
import java.util.Map;

public abstract class TaskConsumer implements TaskConsumerInterface {
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

  //endregion
}
