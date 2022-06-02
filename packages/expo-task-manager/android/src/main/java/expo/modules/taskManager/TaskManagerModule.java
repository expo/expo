package expo.modules.taskManager;

import android.content.Context;
import android.os.Handler;

import expo.modules.core.ExportedModule;
import expo.modules.core.ModuleRegistry;
import expo.modules.core.Promise;
import expo.modules.core.interfaces.ExpoMethod;
import expo.modules.interfaces.taskManager.TaskManagerInterface;
import expo.modules.interfaces.taskManager.TaskServiceInterface;

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
  public void isAvailableAsync(final Promise promise) {
    promise.resolve(mTaskService != null);
  }

  @ExpoMethod
  public void notifyTaskFinishedAsync(String taskName, Map<String, Object> response, final Promise promise) {
    if (!checkTaskService(promise)) {
      return;
    }
    mTaskService.notifyTaskFinished(taskName, getAppScopeKey(), response);
    promise.resolve(null);
  }

  @ExpoMethod
  public void isTaskRegisteredAsync(String taskName, final Promise promise) {
    if (!checkTaskService(promise)) {
      return;
    }
    promise.resolve(mTaskService.hasRegisteredTask(taskName, getAppScopeKey()));
  }

  @ExpoMethod
  public void getTaskOptionsAsync(String taskName, final Promise promise) {
    if (!checkTaskService(promise)) {
      return;
    }
    promise.resolve(mTaskService.getTaskOptions(taskName, getAppScopeKey()));
  }

  @ExpoMethod
  public void getRegisteredTasksAsync(final Promise promise) {
    if (!checkTaskService(promise)) {
      return;
    }
    promise.resolve(mTaskService.getTasksForAppScopeKey(getAppScopeKey()));
  }

  @ExpoMethod
  public void unregisterTaskAsync(String taskName, final Promise promise) {
    if (!checkTaskService(promise)) {
      return;
    }
    try {
      mTaskService.unregisterTask(taskName, getAppScopeKey(), null);
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
      mTaskService.unregisterAllTasksForAppScopeKey(getAppScopeKey());
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

  private String getAppScopeKey() {
    return mTaskManagerInternal.getAppScopeKey();
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
