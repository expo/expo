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
  private static final String TASK_PREFIX = "_expoNotificationBackgroundAction:";

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
    constants.put("TASK_PREFIX", TASK_PREFIX);
    return constants;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    Log.i("hawef", "NOOOOOOOOOO");
    Log.i("hawef", moduleRegistry.toString());
    mTaskManager = moduleRegistry.getModule(TaskManagerInterface.class);
  }

  @ExpoMethod
  public void registerTaskAsync(String categoryId, Map<String, Object> options, final Promise promise) {
    Log.i("hawef", "PLEEEEEEEEEESE");
    Log.i("hawef", mTaskManager.toString());
    try {
      mTaskManager.registerTask(getTaskName(categoryId), NotificationBackgroundActionTaskConsumer.class, options);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ExpoMethod
  public void unregisterTaskAsync(String categoryId, final Promise promise) {
    try {
      mTaskManager.unregisterTask(getTaskName(categoryId), NotificationBackgroundActionTaskConsumer.class);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  public static String getTaskName(String categoryId) {
    // If this is changed, also remember to change `addActionBackgroundListener` function in `expo` package.
    return TASK_PREFIX + categoryId;
  }
}
