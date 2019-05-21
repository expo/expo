package expo.modules.taskManager;

import android.app.PendingIntent;
import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Parcelable;
import android.os.PersistableBundle;
import android.support.v4.util.ArraySet;
import android.util.Log;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.unimodules.interfaces.taskManager.TaskManagerUtilsInterface;
import org.unimodules.interfaces.taskManager.TaskInterface;

public class TaskManagerUtils implements TaskManagerUtilsInterface {
  // Key that every job created by the task manager must contain in its extras bundle.
  private static final String EXTRAS_REQUIRED_KEY = "expo.modules.taskManager";

  // Request code number used for pending intents created by this module.
  private static final int PENDING_INTENT_REQUEST_CODE = 5055;

  private static final int DEFAULT_OVERRIDE_DEADLINE = 60 * 1000; // 1 minute

  private static final Set<TaskInterface> sTasksReschedulingJob = new ArraySet<>();

  //region TaskManagerUtilsInterface

  @Override
  public PendingIntent createTaskIntent(Context context, TaskInterface task) {
    return createTaskIntent(context, task, PendingIntent.FLAG_UPDATE_CURRENT);
  }

  @Override
  public void cancelTaskIntent(Context context, String appId, String taskName) {
    PendingIntent pendingIntent = createTaskIntent(context, appId, taskName, PendingIntent.FLAG_NO_CREATE);

    if (pendingIntent != null) {
      pendingIntent.cancel();
    }
  }

  @Override
  public void scheduleJob(Context context, TaskInterface task, List<PersistableBundle> data) {
    updateOrScheduleJob(context, task, data);
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
  //region static helpers

  static boolean notifyTaskJobCancelled(TaskInterface task) {
    boolean isRescheduled = sTasksReschedulingJob.contains(task);

    if (isRescheduled) {
      sTasksReschedulingJob.remove(task);
    }
    return isRescheduled;
  }

  //endregion static helpers
  //region private helpers

  private void updateOrScheduleJob(Context context, TaskInterface task, List<PersistableBundle> data) {
    JobScheduler jobScheduler = (JobScheduler) context.getSystemService(Context.JOB_SCHEDULER_SERVICE);

    if (jobScheduler == null) {
      Log.e(this.getClass().getName(), "Job scheduler not found!");
      return;
    }

    List<JobInfo> pendingJobs = jobScheduler.getAllPendingJobs();

    Collections.sort(pendingJobs, new Comparator<JobInfo>() {
      @Override
      public int compare(JobInfo a, JobInfo b) {
        return Integer.compare(a.getId(), b.getId());
      }
    });

    // We will be looking for the lowest number that is not being used yet.
    int newJobId = 0;

    for (JobInfo jobInfo : pendingJobs) {
      int jobId = jobInfo.getId();

      if (isJobInfoRelatedToTask(jobInfo, task)) {
        JobInfo mergedJobInfo = createJobInfoByAddingData(jobInfo, data);

        // Add the task to the list of rescheduled tasks.
        sTasksReschedulingJob.add(task);

        try {
          // Cancel jobs with the same ID to let them be rescheduled.
          jobScheduler.cancel(jobId);

          // Reschedule job for given task.
          jobScheduler.schedule(mergedJobInfo);
        } catch (IllegalStateException e) {
          Log.e(this.getClass().getName(), "Unable to reschedule a job: " + e.getMessage());
        }
        return;
      }
      if (newJobId == jobId) {
        newJobId++;
      }
    }

    try {
      // Given task doesn't have any pending jobs yet, create a new JobInfo and schedule it then.
      JobInfo jobInfo = createJobInfo(context, task, newJobId, data);
      jobScheduler.schedule(jobInfo);
    } catch (IllegalStateException e) {
      Log.e(this.getClass().getName(), "Unable to schedule a new job: " + e.getMessage());
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

  private PendingIntent createTaskIntent(Context context, String appId, String taskName, int flags) {
    if (context == null) {
      return null;
    }

    Intent intent = new Intent(TaskBroadcastReceiver.INTENT_ACTION, null, context, TaskBroadcastReceiver.class);

    Uri dataUri = new Uri.Builder()
        .appendQueryParameter("appId", appId)
        .appendQueryParameter("taskName", taskName)
        .build();

    intent.setData(dataUri);

    return PendingIntent.getBroadcast(context, PENDING_INTENT_REQUEST_CODE, intent, flags);
  }

  private PendingIntent createTaskIntent(Context context, TaskInterface task, int flags) {
    String appId = task.getAppId();
    String taskName = task.getName();

    return createTaskIntent(context, appId, taskName, flags);
  }

  private JobInfo createJobInfo(int jobId, ComponentName jobService, PersistableBundle extras) {
    return new JobInfo.Builder(jobId, jobService)
        .setExtras(extras)
        .setMinimumLatency(0)
        .setOverrideDeadline(DEFAULT_OVERRIDE_DEADLINE)
        .build();
  }

  private JobInfo createJobInfo(Context context, TaskInterface task, int jobId, List<PersistableBundle> data) {
    return createJobInfo(jobId, new ComponentName(context, TaskJobService.class), createExtrasForTask(task, data));
  }

  private PersistableBundle createExtrasForTask(TaskInterface task, List<PersistableBundle> data) {
    PersistableBundle extras = new PersistableBundle();

    extras.putInt(EXTRAS_REQUIRED_KEY, 1);
    extras.putString("appId", task.getAppId());
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
    String appId = task.getAppId();
    String taskName = task.getName();

    if (extras.containsKey(EXTRAS_REQUIRED_KEY)) {
      return appId.equals(extras.getString("appId", "")) && taskName.equals(extras.getString("taskName", ""));
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
