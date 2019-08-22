package host.exp.exponent.notifications.backgroundActions;

import android.content.Context;
import android.util.Log;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.interfaces.taskManager.TaskManagerInterface;

import java.util.Map;

public class NotificationBackgroundActionModule extends ExportedModule {
  private TaskManagerInterface mTaskManager;

  public NotificationBackgroundActionModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoNotificationBackgroundAction";
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
      mTaskManager.registerTask(taskName, NotificationBackgroundActionTaskConsumer.class, options);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void unregisterTaskAsync(String taskName, final Promise promise) {
    try {
      mTaskManager.unregisterTask(taskName, NotificationBackgroundActionTaskConsumer.class);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }
}
