package host.exp.exponent.notifications.backgroundActions;

import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Context;
import android.os.Bundle;
import android.os.PersistableBundle;

import org.unimodules.core.interfaces.LifecycleEventListener;
import org.unimodules.interfaces.taskManager.TaskConsumer;
import org.unimodules.interfaces.taskManager.TaskConsumerInterface;
import org.unimodules.interfaces.taskManager.TaskExecutionCallback;
import org.unimodules.interfaces.taskManager.TaskInterface;
import org.unimodules.interfaces.taskManager.TaskManagerUtilsInterface;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class NotificationBackgroundActionTaskConsumer extends TaskConsumer implements TaskConsumerInterface, LifecycleEventListener {
  private TaskInterface mTask;
  static public HashMap<String, TaskInterface> mTasks = new HashMap<>();

  public NotificationBackgroundActionTaskConsumer(Context context, TaskManagerUtilsInterface taskManagerUtils) {
    super(context, taskManagerUtils);
  }

  //region TaskConsumerInterface

  @Override
  public String taskType() {
    return "notificationBackgroundAction";
  }

  @Override
  public void didRegister(TaskInterface task) {
    mTask = task;
    mTasks.put(task.getName(), task);
  }

  @Override
  public void didUnregister() {
    // Cancel pending intent.
    getTaskManagerUtils().cancelTaskIntent(getContext(), mTask.getAppId(), mTask.getName());

    mTasks.remove(mTask.getName());
    mTask = null;
  }

  @Override
  public boolean didExecuteJob(final JobService jobService, final JobParameters params) {
    List<PersistableBundle> data = getTaskManagerUtils().extractDataFromJobParams(params);

    PersistableBundle persistableBundle = data.get(0);
    Bundle bundle = new Bundle(persistableBundle);

    mTask.execute(bundle, null, new TaskExecutionCallback() {
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
