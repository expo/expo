package expo.modules.taskManager;

import android.app.PendingIntent;
import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Parcelable;
import android.os.PersistableBundle;
import android.util.Log;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import expo.modules.interfaces.taskManager.TaskExecutionCallback;
import expo.modules.interfaces.taskManager.TaskInterface;
import expo.modules.interfaces.taskManager.TaskManagerUtilsInterface;

public class TaskManagerUtils implements TaskManagerUtilsInterface {

  // Key that every job created by the task manager must contain in its extras
  // bundle.
  private static final String EXTRAS_REQUIRED_KEY = "expo.modules.taskManager";
  private static final String TAG = "TaskManagerUtils";

  // Request code number used for pending intents created by this module.
  private static final int PENDING_INTENT_REQUEST_CODE = 5055;

  private static final int DEFAULT_OVERRIDE_DEADLINE = 60 * 1000; // 1 minute

  // Leave buffer before Android's job limit to avoid edge cases.
  private static final int JOB_LIMIT_BUFFER = 10;

  private static int getJobLimit() {
    // Android 12 (API 31+) increased limit from 100 to 150
    return Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? 150 : 100;
  }

  // region TaskManagerUtilsInterface

  @Override
  public PendingIntent createTaskIntent(Context context, TaskInterface task) {
    return createTaskIntent(context, task, PendingIntent.FLAG_UPDATE_CURRENT);
  }

  @Override
  public void cancelTaskIntent(Context context, String appScopeKey, String taskName) {
    PendingIntent pendingIntent = createTaskIntent(context, appScopeKey, taskName, PendingIntent.FLAG_NO_CREATE);

    if (pendingIntent != null) {
      pendingIntent.cancel();
    }
  }

  @Override
  public void scheduleJob(Context context, @NonNull TaskInterface task, List<PersistableBundle> data) {
    if (task == null) {
      Log.e(TAG, "Trying to schedule job for null task!");
    } else {
      updateOrScheduleJob(context, task, data);
    }
  }

  @Override
  public void executeTask(TaskInterface task, Bundle data, @Nullable TaskExecutionCallback callback) {
    if (task == null) {
      Log.e(TAG, "Trying to execute a null task!");
    } else {
      task.execute(data, null, callback);
    }
  }

  @Override
  public void cancelScheduledJob(Context context, int jobId) {
    JobScheduler jobScheduler = (JobScheduler) context.getSystemService(Context.JOB_SCHEDULER_SERVICE);

    if (jobScheduler != null) {
      jobScheduler.cancel(jobId);
    } else {
      Log.e(this.getClass().getName(), "Job scheduler not found!");
    }
  }

  @Override
  public List<PersistableBundle> extractDataFromJobParams(JobParameters params) {
    PersistableBundle extras = params.getExtras();
    List<PersistableBundle> data = new ArrayList<>();
    int dataSize = extras.getInt("dataSize", 0);

    for (int i = 0; i < dataSize; i++) {
      data.add(extras.getPersistableBundle(String.valueOf(i)));
    }
    return data;
  }

  //endregion TaskManagerUtilsInterface
  //region private helpers

  private void updateOrScheduleJob(Context context, TaskInterface task, List<PersistableBundle> data) {
    JobScheduler jobScheduler = (JobScheduler) context.getSystemService(Context.JOB_SCHEDULER_SERVICE);

    if (jobScheduler == null) {
      Log.e(this.getClass().getName(), "Job scheduler not found!");
      return;
    }

    List<JobInfo> pendingJobs = jobScheduler.getAllPendingJobs();
    if (pendingJobs == null) {
      // There is a mismatch between documentation and implementation. In the reference implementation null is returned in case of RemoteException:
      // https://android.googlesource.com/platform//frameworks/base/+/980636f0a5440a12f5d8896d8738c6fcf2430553/apex/jobscheduler/framework/java/android/app/JobSchedulerImpl.java#137
      pendingJobs = new ArrayList<>();
    }

    // Find newest job for this task (for merging if needed) and next available ID
    int newJobId = 0;
    JobInfo newestJob = null;

    for (JobInfo jobInfo : pendingJobs) {
      int jobId = jobInfo.getId();
      if (jobId >= newJobId) {
        newJobId = jobId + 1;
      }
      if (isJobInfoRelatedToTask(jobInfo, task)) {
        if (newestJob == null || jobId > newestJob.getId()) {
          newestJob = jobInfo;
        }
      }
    }

    // At Android's job limit? Merge into newest job for this task.
    if (pendingJobs.size() >= getJobLimit() - JOB_LIMIT_BUFFER && newestJob != null) {
      Log.i(TAG, "Approaching job limit (" + pendingJobs.size() + "). Merging data for task '" + task.getName() + "'.");
      try {
        JobInfo mergedJobInfo = createJobInfoByAddingData(newestJob, data);
        jobScheduler.cancel(newestJob.getId());
        jobScheduler.schedule(mergedJobInfo);
      } catch (IllegalStateException e) {
        Log.e(this.getClass().getName(), "Unable to merge job: " + e.getMessage());
      }
      return;
    }

    // Under limit: schedule as new job. Don't touch existing jobs.
    try {
      JobInfo jobInfo = createJobInfo(context, task, newJobId, data);
      jobScheduler.schedule(jobInfo);
    } catch (IllegalStateException e) {
      Log.e(this.getClass().getName(), "Unable to schedule job: " + e.getMessage());
    }
  }

  private JobInfo createJobInfoByAddingData(JobInfo jobInfo, List<PersistableBundle> data) {
    PersistableBundle mergedExtras = jobInfo.getExtras();
    int dataSize = mergedExtras.getInt("dataSize", 0);

    if (data != null) {
      mergedExtras.putInt("dataSize", dataSize + data.size());

      for (int i = 0; i < data.size(); i++) {
        mergedExtras.putPersistableBundle(String.valueOf(dataSize + i), data.get(i));
      }
    }
    return createJobInfo(jobInfo.getId(), jobInfo.getService(), mergedExtras);
  }

  private PendingIntent createTaskIntent(Context context, String appScopeKey, String taskName, int flags) {
    if (context == null) {
      return null;
    }

    Intent intent = new Intent(TaskBroadcastReceiver.INTENT_ACTION, null, context, TaskBroadcastReceiver.class);

    // query param is called appId for legacy reasons
    Uri dataUri = new Uri.Builder()
      .appendQueryParameter("appId", appScopeKey)
      .appendQueryParameter("taskName", taskName)
      .build();

    intent.setData(dataUri);

    // We're defaulting to the behaviour prior API 31 (mutable) even though Android recommends immutability
    int mutableFlag = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ? PendingIntent.FLAG_MUTABLE : 0;
    return PendingIntent.getBroadcast(context, PENDING_INTENT_REQUEST_CODE, intent, flags | mutableFlag);
  }

  private PendingIntent createTaskIntent(Context context, TaskInterface task, int flags) {
    String appScopeKey = task.getAppScopeKey();
    String taskName = task.getName();

    return createTaskIntent(context, appScopeKey, taskName, flags);
  }

  private JobInfo createJobInfo(int jobId, ComponentName jobService, PersistableBundle extras) {
    JobInfo.Builder jobBuilder = new JobInfo.Builder(jobId, jobService)
        .setExtras(extras)
        .setPersisted(true)
        .setRequiresDeviceIdle(false);

    if (Build.VERSION.SDK_INT < 28) {
      // For Android versions below 28 (Android 9 and below)
      jobBuilder.setMinimumLatency(0)
          .setOverrideDeadline(DEFAULT_OVERRIDE_DEADLINE);
    } else if (Build.VERSION.SDK_INT < 31) {
      // For Android 9 (API 28) to Android 11 (API 30)
      jobBuilder.setImportantWhileForeground(true);
    } else {
      // For Android 12 (API 31) and above
      jobBuilder.setExpedited(true);
    }

    return jobBuilder.build();
  }

  private JobInfo createJobInfo(Context context, TaskInterface task, int jobId, List<PersistableBundle> data) {
    return createJobInfo(jobId, new ComponentName(context, TaskJobService.class), createExtrasForTask(task, data));
  }

  private PersistableBundle createExtrasForTask(TaskInterface task, List<PersistableBundle> data) {
    PersistableBundle extras = new PersistableBundle();

    // persistable bundle extras key is called appId for legacy reasons
    extras.putInt(EXTRAS_REQUIRED_KEY, 1);
    extras.putString("appId", task.getAppScopeKey());
    extras.putString("taskName", task.getName());

    if (data != null) {
      extras.putInt("dataSize", data.size());

      for (int i = 0; i < data.size(); i++) {
        extras.putPersistableBundle(String.valueOf(i), data.get(i));
      }
    } else {
      extras.putInt("dataSize", 0);
    }

    return extras;
  }

  private boolean isJobInfoRelatedToTask(JobInfo jobInfo, TaskInterface task) {
    PersistableBundle extras = jobInfo.getExtras();

    // persistable bundle extras key is called appId for legacy reasons
    String appScopeKey = task.getAppScopeKey();
    String taskName = task.getName();

    if (extras.containsKey(EXTRAS_REQUIRED_KEY)) {
      return appScopeKey.equals(extras.getString("appId", "")) && taskName.equals(extras.getString("taskName", ""));
    }
    return false;
  }

  //endregion private helpers
  //region converting map to bundle

  @SuppressWarnings("unchecked")
  static Bundle mapToBundle(Map<String, Object> map) {
    Bundle bundle = new Bundle();

    for (Map.Entry<String, Object> entry : map.entrySet()) {
      Object value = entry.getValue();
      String key = entry.getKey();

      if (value instanceof Double) {
        bundle.putDouble(key, (Double) value);
      } else if (value instanceof Integer) {
        bundle.putInt(key, (Integer) value);
      } else if (value instanceof String) {
        bundle.putString(key, (String) value);
      } else if (value instanceof Boolean) {
        bundle.putBoolean(key, (Boolean) value);
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
  private static double[] listToDoubleArray(List<Object> list) {
    double[] doubles = new double[list.size()];
    for (int i = 0; i < list.size(); i++) {
      doubles[i] = (Double) list.get(i);
    }
    return doubles;
  }

  @SuppressWarnings("unchecked")
  private static int[] listToIntArray(List<Object> list) {
    int[] integers = new int[list.size()];
    for (int i = 0; i < list.size(); i++) {
      integers[i] = (Integer) list.get(i);
    }
    return integers;
  }

  @SuppressWarnings("unchecked")
  private static String[] listToStringArray(List<Object> list) {
    String[] strings = new String[list.size()];
    for (int i = 0; i < list.size(); i++) {
      strings[i] = list.get(i).toString();
    }
    return strings;
  }

  @SuppressWarnings("unchecked")
  private static ArrayList<Parcelable> listToParcelableArrayList(List<Object> list) {
    ArrayList<Parcelable> arrayList = new ArrayList<>();

    for (Object item : list) {
      Map<String, Object> map = (Map<String, Object>) item;
      arrayList.add(mapToBundle(map));
    }
    return arrayList;
  }

  //endregion converting map to bundle
}
