package expo.modules.backgroundfetch;

import android.content.Context;

import java.util.Map;

import expo.modules.core.ExportedModule;
import expo.modules.core.ModuleRegistry;
import expo.modules.core.Promise;
import expo.modules.core.interfaces.ExpoMethod;
import expo.modules.interfaces.taskManager.TaskManagerInterface;

class BackgroundFetchModule extends ExportedModule {
  private TaskManagerInterface mTaskManager;

  public BackgroundFetchModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoBackgroundFetch";
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mTaskManager = moduleRegistry.getModule(TaskManagerInterface.class);
  }

  @ExpoMethod
  public void registerTaskAsync(String taskName, Map<String, Object> options, final Promise promise) {
    try {
      mTaskManager.registerTask(taskName, BackgroundFetchTaskConsumer.class, options);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void unregisterTaskAsync(String taskName, final Promise promise) {
    try {
      mTaskManager.unregisterTask(taskName, BackgroundFetchTaskConsumer.class);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }
}
