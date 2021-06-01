package expo.modules.notifications.notifications.background;

import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Context;
import android.os.Build;
import android.os.PersistableBundle;
import android.os.Bundle;
import android.os.BaseBundle;
import android.util.Log;


import expo.modules.notifications.notifications.NotificationSerializer;
import expo.modules.notifications.service.delegates.ExpoHandlingDelegate;
import expo.modules.notifications.notifications.model.Notification;
import org.unimodules.interfaces.taskManager.TaskConsumer;
import org.unimodules.interfaces.taskManager.TaskConsumerInterface;
import org.unimodules.interfaces.taskManager.TaskExecutionCallback;
import org.unimodules.interfaces.taskManager.TaskInterface;
import org.unimodules.interfaces.taskManager.TaskManagerUtilsInterface;

import java.util.Collections;
import java.util.Map;
import java.util.List;
import java.util.Iterator;
import org.json.JSONObject;
import org.json.JSONException;

public class BackgroundRemoteNotificationTaskConsumer extends TaskConsumer implements TaskConsumerInterface {
  private static final String TAG = BackgroundRemoteNotificationTaskConsumer.class.getSimpleName();
  private static final String NOTIFICATION_KEY = NOTIFICATION_KEY;

  private TaskInterface mTask;

  public BackgroundRemoteNotificationTaskConsumer(Context context, TaskManagerUtilsInterface taskManagerUtils) {
    super(context, taskManagerUtils);
    ExpoHandlingDelegate.Companion.addBackgroundTaskConsumer(this);
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
    TaskManagerUtilsInterface taskManagerUtils = getTaskManagerUtils();

    if (context != null && mTask != null) {
      PersistableBundle data = new PersistableBundle();
      data.putString(NOTIFICATION_KEY, bundleToJson(bundle).toString());
      taskManagerUtils.scheduleJob(context, mTask, Collections.singletonList(data));
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
      bundle.putBundle(NOTIFICATION_KEY, JsonStringToBundle(item.getString(NOTIFICATION_KEY)));
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

  private static Bundle JsonStringToBundle(String jsonString) {
    Bundle bundle = new Bundle();
    try {
      JSONObject jsonObject = new JSONObject(jsonString);
      return NotificationSerializer.toBundle(jsonObject);
    } catch (JSONException e) {
      Log.e("expo-notifications", "Could not parse notification from JSON string. " + e.getMessage());
    }
    return bundle;
  }

  //endregion
}