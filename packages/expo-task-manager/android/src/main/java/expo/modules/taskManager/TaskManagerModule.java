package expo.modules.taskManager;

import android.content.Context;
import android.os.Handler;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.interfaces.taskManager.TaskManagerInterface;
import org.unimodules.interfaces.taskManager.TaskServiceInterface;

import java.util.HashMap;
import java.util.Map;

public class TaskManagerModule extends ExportedModule {

  private TaskServiceInterface mTaskService;
  private TaskManagerInterface mTaskManagerInternal;

  public TaskManagerModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoTaskManager";
  }

  @Override
  public Map<String, Object> getConstants() {
    Map<String, Object> constants = new HashMap<>();
    constants.put("EVENT_NAME", TaskManagerInterface.EVENT_NAME);
    return constants;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mTaskService = moduleRegistry.getSingletonModule("TaskService", TaskServiceInterface.class);
    mTaskManagerInternal = moduleRegistry.getModule(TaskManagerInterface.class);
  }

  //region Expo methods

  @ExpoMethod
  public void notifyTaskFinishedAsync(String taskName, Map<String, Object> response, final Promise promise) {
    if (!checkTaskService(promise)) {
      return;
    }
    mTaskService.notifyTaskFinished(taskName, getAppId(), response);
    promise.resolve(null);
  }

  @ExpoMethod
  public void isTaskRegisteredAsync(String taskName, final Promise promise) {
    if (!checkTaskService(promise)) {
      return;
    }
    promise.resolve(mTaskService.hasRegisteredTask(taskName, getAppId()));
  }

  @ExpoMethod
  public void getTaskOptionsAsync(String taskName, final Promise promise) {
    if (!checkTaskService(promise)) {
      return;
    }
    promise.resolve(mTaskService.getTaskOptions(taskName, getAppId()));
  }

  @ExpoMethod
  public void getRegisteredTasksAsync(final Promise promise) {
    if (!checkTaskService(promise)) {
      return;
    }
    promise.resolve(mTaskService.getTasksForAppId(getAppId()));
  }

  @ExpoMethod
  public void unregisterTaskAsync(String taskName, final Promise promise) {
    if (!checkTaskService(promise)) {
      return;
    }
    try {
      mTaskService.unregisterTask(taskName, getAppId(), null);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void unregisterAllTasksAsync(final Promise promise) {
    if (!checkTaskService(promise)) {
      return;
    }
    try {
      mTaskService.unregisterAllTasksForAppId(getAppId());
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void startObserving(final Promise promise) {
    Handler handler = new Handler();
    handler.postDelayed(new Runnable() {
      @Override
      public void run() {
        if (mTaskManagerInternal != null) {
          mTaskManagerInternal.flushQueuedEvents();
        }
      }
    }, 1000);
    promise.resolve(null);
  }

  @ExpoMethod
  public void stopObserving(final Promise promise) {
    // nothing
    promise.resolve(null);
  }

  //endregion
  //region helpers

  private String getAppId() {
    return mTaskManagerInternal.getAppId();
  }

  private boolean checkTaskService(final Promise promise) {
    if (mTaskService == null) {
      promise.reject(TaskManagerInterface.ERR_TASK_SERVICE_NOT_FOUND, "Unable to find TaskService singleton module in module registry.");
      return false;
    }
    return true;
  }

  //endregion
}
