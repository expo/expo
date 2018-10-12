package expo.modules.taskManager;

import android.app.PendingIntent;
import android.app.job.JobInfo;
import android.app.job.JobScheduler;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Parcelable;
import android.os.PersistableBundle;
import android.util.Log;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import expo.interfaces.taskManager.TaskManagerUtilsInterface;
import expo.interfaces.taskManager.TaskInterface;

public class TaskManagerUtils implements TaskManagerUtilsInterface {
  private static final int DEFAULT_OVERRIDE_DEADLINE = 60 * 1000; // 1 minute
  private static Integer sCurrentJobId = 2137; // make job ids locally-unique

  public PendingIntent createTaskIntent(Context context, TaskInterface task) {
    Integer jobId = sCurrentJobId++;
    String appId = task.getAppId();
    String taskName = task.getName();
    Intent intent = new Intent(TaskBroadcastReceiver.INTENT_ACTION, null, context, TaskBroadcastReceiver.class);

    Uri dataUri = new Uri.Builder()
        .appendQueryParameter("jobId", jobId.toString())
        .appendQueryParameter("appId", appId)
        .appendQueryParameter("taskName", taskName)
        .build();

    intent.setData(dataUri);

    return PendingIntent.getBroadcast(context, jobId, intent, PendingIntent.FLAG_UPDATE_CURRENT);
  }

  public void scheduleJob(Context context, JobInfo jobInfo) {
    JobScheduler jobScheduler = (JobScheduler) context.getSystemService(Context.JOB_SCHEDULER_SERVICE);
    jobScheduler.schedule(jobInfo);
  }

  public void scheduleJob(Context context, TaskInterface task, PersistableBundle data) {
    Integer jobId = sCurrentJobId++;
    PersistableBundle extras = new PersistableBundle();

    extras.putString("appId", task.getAppId());
    extras.putString("taskName", task.getName());
    extras.putPersistableBundle("data", data);

    JobInfo jobInfo = new JobInfo.Builder(jobId, new ComponentName(context, TaskJobService.class))
        .setExtras(extras)
        .setMinimumLatency(0)
        .setOverrideDeadline(DEFAULT_OVERRIDE_DEADLINE)
        .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
        .build();

    scheduleJob(context, jobInfo);
    Log.i("TaskManagerUtils", "Scheduled job for task '" + task.getName() + "'.");
  }

  @SuppressWarnings("unchecked")
  public static Bundle mapToBundle(Map<String, Object> map) {
    Bundle bundle = new Bundle();

    for (Map.Entry<String, Object> entry : map.entrySet()) {
      Object value = entry.getValue();
      String key = entry.getKey();

      if (value instanceof Double) {
        bundle.putDouble(key, ((Double) value).doubleValue());
      } else if (value instanceof Integer) {
        bundle.putInt(key, ((Integer) value).intValue());
      } else if (value instanceof String) {
        bundle.putString(key, (String) value);
      } else if (value instanceof List) {
        List<Object> list = (List<Object>) value;
        Object first = list.get(0);

        if (first == null || first instanceof Double) {
          bundle.putDoubleArray(key, listToDoubleArray(list));
        } else if (first instanceof Integer) {
          bundle.putIntArray(key, listToIntArray(list));
        } else if (first instanceof String) {
          bundle.putStringArray(key, listToStringArray(list));
        } else if (first instanceof Map) {
          bundle.putParcelableArrayList(key, listToParcelableArrayList(list));
        }
      } else if (value instanceof Map) {
        bundle.putBundle(key, mapToBundle((Map<String, Object>) value));
      }
    }
    return bundle;
  }

  @SuppressWarnings("unchecked")
  public static double[] listToDoubleArray(List<Object> list) {
    double[] doubles = new double[list.size()];
    for (int i = 0; i < list.size(); i++) {
      doubles[i] = ((Double) list.get(i)).doubleValue();
    }
    return doubles;
  }

  @SuppressWarnings("unchecked")
  public static int[] listToIntArray(List<Object> list) {
    int[] integers = new int[list.size()];
    for (int i = 0; i < list.size(); i++) {
      integers[i] = ((Integer) list.get(i)).intValue();
    }
    return integers;
  }

  @SuppressWarnings("unchecked")
  public static String[] listToStringArray(List<Object> list) {
    String[] strings = new String[list.size()];
    for (int i = 0; i < list.size(); i++) {
      strings[i] = list.get(i).toString();
    }
    return strings;
  }

  @SuppressWarnings("unchecked")
  public static ArrayList<Parcelable> listToParcelableArrayList(List<Object> list) {
    ArrayList<Parcelable> arrayList = new ArrayList<>();

    for (Object item : list) {
      Map<String, Object> map = (Map<String, Object>) item;
      arrayList.add(mapToBundle(map));
    }
    return arrayList;
  }
}
