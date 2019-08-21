package host.exp.exponent.notifications;

import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import java.util.Map;

import org.unimodules.core.interfaces.LifecycleEventListener;
import org.unimodules.interfaces.taskManager.TaskConsumer;
import org.unimodules.interfaces.taskManager.TaskConsumerInterface;
import org.unimodules.interfaces.taskManager.TaskExecutionCallback;
import org.unimodules.interfaces.taskManager.TaskInterface;
import org.unimodules.interfaces.taskManager.TaskManagerUtilsInterface;

public class NotificationBackgroundTaskConsumer extends TaskConsumer implements TaskConsumerInterface, LifecycleEventListener {
  private static final String TAG = "NotificationBackgroundTaskConsumer";

  private TaskInterface mTask;

  public NotificationBackgroundTaskConsumer(Context context, TaskManagerUtilsInterface taskManagerUtils) {
    super(context, taskManagerUtils);
  }

  //region TaskConsumerInterface

  @Override
  public String taskType() {
    return "notificationBackgroundAction";
  }

  @Override
  public boolean canReceiveCustomBroadcast(String action) {
    // Let the TaskService know that we want to receive custom broadcasts
    // having "android.intent.action.BOOT_COMPLETED" action.
    return Intent.ACTION_BOOT_COMPLETED.equals(action);
  }

  @Override
  public void didRegister(TaskInterface task) {
    mTask = task;
  }

  @Override
  public void didUnregister() {
    // Cancel pending intent.
    getTaskManagerUtils().cancelTaskIntent(getContext(), mTask.getAppId(), mTask.getName());

    mTask = null;
  }

  @Override
  public void didReceiveBroadcast(Intent intent) {
    String action = intent.getAction();

    Context context = getContext();
    TaskManagerUtilsInterface taskManagerUtils = getTaskManagerUtils();

    if (context != null) {
      taskManagerUtils.scheduleJob(context, mTask, null);
    }
  }

  @Override
  public boolean didExecuteJob(final JobService jobService, final JobParameters params) {
    mTask.execute(null, null, new TaskExecutionCallback() {
      @Override
      public void onFinished(Map<String, Object> response) {
        jobService.jobFinished(params, false);
      }
    });

    // Returning `true` indicates that the job is still running, but in async mode.
    // In that case we're obligated to call `jobService.jobFinished` as soon as the async block finishes.
    return true;
  }

  //endregion
  //region private methods

  //endregion
  //region LifecycleEventListener

  @Override
  public void onHostResume() {
  }

  @Override
  public void onHostPause() {
  }

  @Override
  public void onHostDestroy() {
  }

  //endregion
}
