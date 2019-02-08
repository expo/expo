package expo.modules.backgroundfetch;

import android.content.Context;

import java.util.Map;

import expo.core.ExportedModule;
import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.interfaces.taskManager.TaskManagerInterface;

class BackgroundFetchModule extends ExportedModule implements ModuleRegistryConsumer {
  private TaskManagerInterface mTaskManager;

  public BackgroundFetchModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoBackgroundFetch";
  }

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
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
