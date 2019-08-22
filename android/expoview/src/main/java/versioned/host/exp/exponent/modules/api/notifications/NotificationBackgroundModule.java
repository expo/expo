package versioned.host.exp.exponent.modules.api.notifications;

import android.content.Context;
import android.util.Log;

import org.unimodules.core.BasePackage;
import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.interfaces.taskManager.TaskManagerInterface;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import expo.modules.location.LocationModule;

public class NotificationBackgroundModule extends ExportedModule {
  private TaskManagerInterface mTaskManager;

  public NotificationBackgroundModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoNotificationBackground";
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    Log.i("hawef", "NOOOOOOOOOO");
    Log.i("hawef", moduleRegistry.toString());
    mTaskManager = moduleRegistry.getModule(TaskManagerInterface.class);
  }

  @ExpoMethod
  public void registerTaskAsync(String taskName, Map<String, Object> options, final Promise promise) {
    Log.i("hawef", "PLEEEEEEEEEESE");
    Log.i("hawef", mTaskManager.toString());
    try {
      mTaskManager.registerTask(taskName, NotificationBackgroundTaskConsumer.class, options);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void unregisterTaskAsync(String taskName, final Promise promise) {
    try {
      mTaskManager.unregisterTask(taskName, NotificationBackgroundTaskConsumer.class);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }
}
