package expo.modules.taskManager;

import android.content.Context;

import expo.modules.core.BasePackage;
import expo.modules.core.interfaces.InternalModule;
import expo.modules.core.interfaces.SingletonModule;
import expo.modules.interfaces.taskManager.TaskServiceInterface;
import expo.modules.interfaces.taskManager.TaskServiceProviderInterface;

import java.util.Collections;
import java.util.List;

public class TaskManagerPackage extends BasePackage implements TaskServiceProviderInterface {
  // We'll keep a static TaskService implementation to be able to return this even
  // without the package being loaded as part of the application setup. This makes it
  // possible to start the TaskService before the app is loaded and let the task service
  // load the app if we're started in a context where we don't have an activity.
  // The task service implementation is mostly a singleton through using almost only static
  // fields so it should be safe to share the instance in this way.
  static TaskServiceInterface mTaskService = null;

  /**
   * @param context Current application context
   * @return A task service implementation that can be provided without having setup the whole app
   */
  public TaskServiceInterface getTaskServiceImpl(Context context) {
    if (mTaskService == null) {
      mTaskService = new TaskService(context);
    }
    return mTaskService;
  }

  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Collections.singletonList(new TaskManagerInternalModule(context));
  }

  @Override
  public List<SingletonModule> createSingletonModules(Context context) {
    return Collections.singletonList(getTaskServiceImpl(context));
  }
}
