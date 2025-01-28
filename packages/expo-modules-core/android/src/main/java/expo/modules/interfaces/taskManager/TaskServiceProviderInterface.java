package expo.modules.interfaces.taskManager;

import android.content.Context;

import expo.modules.core.interfaces.Package;

/**
 * Interface defining a package that provides a TaskServiceInterface implementation.
 * This is utilized when an app is launched in the background without an activity.
 * It enables running expo-task-manager JavaScript tasks in the background via the HeadlessAppLoader.
 */
public interface TaskServiceProviderInterface extends Package {
  /**
   * @param context Current application context
   * @return A task service implementation that can be provided without having setup the whole app
   */
  TaskServiceInterface getTaskServiceImpl(Context context);
}
