package host.exp.exponent.notifications.backgroundActions;

import android.content.Context;
import android.util.Log;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.interfaces.taskManager.TaskManagerInterface;

import java.util.HashMap;
import java.util.Map;

public class NotificationBackgroundActionModule extends ExportedModule {
  private TaskManagerInterface mTaskManager;
  public static final String TASK_NAME = "_expoNotificationBackgroundAction";

  public NotificationBackgroundActionModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoNotificationBackgroundAction";
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    constants.put("TASK_NAME", TASK_NAME);
    return constants;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mTaskManager = moduleRegistry.getModule(TaskManagerInterface.class);
  }

  @ExpoMethod
  public void registerTaskAsync(Map<String, Object> options, final Promise promise) {
    try {
      mTaskManager.registerTask(TASK_NAME, NotificationBackgroundActionTaskConsumer.class, options);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void unregisterTaskAsync(final Promise promise) {
    try {
      mTaskManager.unregisterTask(TASK_NAME, NotificationBackgroundActionTaskConsumer.class);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }
}
