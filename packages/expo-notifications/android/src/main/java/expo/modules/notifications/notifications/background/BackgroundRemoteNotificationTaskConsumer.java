package expo.modules.notifications.notifications.background;

import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Context;
import android.os.Bundle;
import android.os.PersistableBundle;
import android.util.Log;
import androidx.annotation.NonNull;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import expo.modules.notifications.notifications.NotificationSerializer;
import expo.modules.notifications.service.delegates.FirebaseMessagingDelegate;
import expo.modules.interfaces.taskManager.TaskConsumer;
import expo.modules.interfaces.taskManager.TaskConsumerInterface;
import expo.modules.interfaces.taskManager.TaskExecutionCallback;
import expo.modules.interfaces.taskManager.TaskInterface;
import expo.modules.interfaces.taskManager.TaskManagerUtilsInterface;

/**
 * Represents a task to be run when the app is receives a remote push
 * notification. Map of current tasks is maintained in {@link FirebaseMessagingDelegate}.
 *
 * Instances are instantiated by expo task manager, after being registered in ExpoBackgroundNotificationTasksModule
 */
public class BackgroundRemoteNotificationTaskConsumer extends TaskConsumer implements TaskConsumerInterface {
  private static final String NOTIFICATION_KEY = "notification";

  private TaskInterface mTask;

  public BackgroundRemoteNotificationTaskConsumer(Context context, TaskManagerUtilsInterface taskManagerUtils) {
    super(context, taskManagerUtils);
    FirebaseMessagingDelegate.Companion.addBackgroundTaskConsumer(this);
  }

  //region TaskConsumerInterface

  @Override
  public String taskType() {
    return "remote-notification";
  }

  @Override
  public void didRegister(TaskInterface task) {
    mTask = task;
  }

  @Override
  public void didUnregister() {
    mTask = null;
  }

  public void scheduleJob(Bundle bundle) {
    Context context = getContext();

    if (context != null && mTask != null) {
      PersistableBundle data = new PersistableBundle();
      // Bundles are not persistable, so let's convert to a JSON string
      data.putString(NOTIFICATION_KEY, bundleToJson(bundle).toString());
      getTaskManagerUtils().scheduleJob(context, mTask, Collections.singletonList(data));
    }
  }

  @Override
  public boolean didExecuteJob(final JobService jobService, final JobParameters params) {
    if (mTask == null) {
      return false;
    }

    List<PersistableBundle> data = getTaskManagerUtils().extractDataFromJobParams(params);

    for (PersistableBundle item : data) {
      Bundle bundle = new Bundle();
      bundle.putBundle(NOTIFICATION_KEY, jsonStringToBundle(item.getString(NOTIFICATION_KEY)));
      mTask.execute(bundle, null, new TaskExecutionCallback() {
        @Override
        public void onFinished(Map<String, Object> response) {
          jobService.jobFinished(params, false);
        }
      });
    }

    // Returning `true` indicates that the job is still running, but in async mode.
    // In that case we're obligated to call `jobService.jobFinished` as soon as the async block finishes.
    return true;
  }

  //endregion
  //region private methods

  private static JSONObject bundleToJson(Bundle bundle) {
    JSONObject json = new JSONObject();
    for (String key : bundle.keySet()) {
      try {
        if (bundle.get(key) instanceof Bundle) {
          json.put(key, bundleToJson((Bundle) bundle.get(key)));
        } else {
          json.put(key, JSONObject.wrap(bundle.get(key)));
        }
      } catch(JSONException e) {
        Log.e("expo-notifications", "Could not create JSON object from notification bundle. " + e.getMessage());
      }
    }
    return json;
  }

  private static Bundle jsonStringToBundle(String jsonString) {
    Bundle bundle = new Bundle();
    try {
      JSONObject jsonObject = new JSONObject(jsonString);
      bundle = NotificationSerializer.toBundle(jsonObject);
    } catch (JSONException e) {
      Log.e("expo-notifications", "Could not parse notification from JSON string. " + e.getMessage());
    }
    return bundle;
  }

  public void executeTask(@NonNull Bundle bundle) {
    mTask.execute(bundle, null);
  }

  //endregion
}
