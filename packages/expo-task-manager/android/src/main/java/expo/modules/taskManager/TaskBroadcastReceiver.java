package expo.modules.taskManager;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class TaskBroadcastReceiver extends BroadcastReceiver {
  public static String INTENT_ACTION = "expo.modules.taskManager.TaskBroadcastReceiver";

  @Override
  public void onReceive(Context context, Intent intent) {
    Context appContext = context.getApplicationContext();
    TaskService taskService = new TaskService(appContext);

    taskService.handleIntent(intent);
  }
}
