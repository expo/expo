package expo.modules.taskManager;

import android.annotation.SuppressLint;
import android.app.job.JobParameters;
import android.app.job.JobService;
import android.content.Context;

@SuppressLint("NewApi")
public class TaskJobService extends JobService {
  @Override
  public boolean onStartJob(JobParameters params) {
    Context context = getApplicationContext();
    return TaskService.getInstance(context).handleJob(this, params);
  }

  @Override
  public boolean onStopJob(JobParameters params) {
    Context context = getApplicationContext();
    return TaskService.getInstance(context).cancelJob(this, params);
  }
}
