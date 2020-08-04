package expo.modules.taskManager;

import android.content.Context;
import android.os.Bundle;

import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.interfaces.InternalModule;
import org.unimodules.core.interfaces.LifecycleEventListener;
import org.unimodules.core.interfaces.services.EventEmitter;
import org.unimodules.core.interfaces.services.UIManager;
import org.unimodules.interfaces.constants.ConstantsInterface;
import org.unimodules.interfaces.taskManager.TaskConsumerInterface;
import org.unimodules.interfaces.taskManager.TaskManagerInterface;
import org.unimodules.interfaces.taskManager.TaskServiceInterface;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class TaskManagerInternalModule implements InternalModule, TaskManagerInterface, LifecycleEventListener {
  private UIManager mUIManager;
  private EventEmitter mEventEmitter;
  private ConstantsInterface mConstants;
  private TaskServiceInterface mTaskService;
  private WeakReference<Context> mContextRef;
  private List<Bundle> mEventsQueue = new ArrayList<>();

  public TaskManagerInternalModule(Context context) {
    mContextRef = new WeakReference<>(context);
  }

  //region InternalModule

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList(TaskManagerInterface.class);
  }

  //endregion
  //region ModuleRegistryConsumer

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mUIManager = moduleRegistry.getModule(UIManager.class);
    mEventEmitter = moduleRegistry.getModule(EventEmitter.class);
    mConstants = moduleRegistry.getModule(ConstantsInterface.class);
    mTaskService = moduleRegistry.getSingletonModule("TaskService", TaskServiceInterface.class);

    // Register in TaskService.
    mTaskService.setTaskManager(this, getAppId(), getAppUrl());

    mUIManager.registerLifecycleEventListener(this);
  }

  @Override
  public void onDestroy() {
    mUIManager.unregisterLifecycleEventListener(this);
    mTaskService.setTaskManager(null, getAppId(), getAppUrl());
  }

  //endregion
  //region TaskManagerInterface

  @Override
  public void registerTask(String taskName, Class consumerClass, Map<String, Object> options) throws Exception {
    checkTaskService();
    mTaskService.registerTask(taskName, getAppId(), getAppUrl(), consumerClass, options);
  }

  @Override
  public void unregisterTask(String taskName, Class consumerClass) throws Exception {
    checkTaskService();
    mTaskService.unregisterTask(taskName, getAppId(), consumerClass);
  }

  @Override
  public synchronized void executeTaskWithBody(Bundle body) {
    if (mEventsQueue != null) {
      // `startObserving` on TaskManagerModule wasn't called yet - add event body to the queue.
      mEventsQueue.add(body);
    } else {
      // Manager is already being observed by JS app, so we can execute the event immediately.
      mEventEmitter.emit(TaskManagerInterface.EVENT_NAME, body);
    }
  }

  @Override
  public boolean taskHasConsumerOfClass(String taskName, Class consumerClass) {
    if (mTaskService == null) {
      return false;
    }
    return mTaskService.taskHasConsumerOfClass(taskName, getAppId(), consumerClass);
  }

  @Override
  public synchronized void flushQueuedEvents() {
    // Execute any events that came before this call.
    if (mEventsQueue != null) {
      for (Bundle body : mEventsQueue) {
        mEventEmitter.emit(TaskManagerInterface.EVENT_NAME, body);
      }
      mEventsQueue = null;
    }
  }

  @Override
  public String getAppId() {
    if (mConstants != null) {
      return mConstants.getAppId();
    }
    return null;
  }
  //endregion
  //region LifecycleEventListener

  @Override
  public void onHostResume() {
    if (!isRunningInHeadlessMode()) {
      List<TaskConsumerInterface> taskConsumers = mTaskService.getTaskConsumers(getAppId());
      for (TaskConsumerInterface taskConsumer : taskConsumers) {
        if (taskConsumer instanceof LifecycleEventListener) {
          ((LifecycleEventListener) taskConsumer).onHostResume();
        }
      }
    }
  }

  @Override
  public void onHostPause() {
    if (!isRunningInHeadlessMode()) {
      List<TaskConsumerInterface> taskConsumers = mTaskService.getTaskConsumers(getAppId());
      for (TaskConsumerInterface taskConsumer : taskConsumers) {
        if (taskConsumer instanceof LifecycleEventListener) {
          ((LifecycleEventListener) taskConsumer).onHostPause();
        }
      }
    }
  }

  @Override
  public void onHostDestroy() {
    if (!isRunningInHeadlessMode()) {
      List<TaskConsumerInterface> taskConsumers = mTaskService.getTaskConsumers(getAppId());
      for (TaskConsumerInterface taskConsumer : taskConsumers) {
        if (taskConsumer instanceof LifecycleEventListener) {
          ((LifecycleEventListener) taskConsumer).onHostDestroy();
        }
      }
    }
  }

  //endregion
  //region helpers

  private boolean isRunningInHeadlessMode() {
    return mTaskService.isStartedByHeadlessLoader(getAppId());
  }

  private String getAppUrl() {
    // If Constants module is available and experienceUrl is provided, just return it.
    if (mConstants != null) {
      String experienceUrl = (String) mConstants.getConstants().get("experienceUrl");
      if (experienceUrl != null) {
        return experienceUrl;
      }
    }

    // Fallback to package name? It should work well for RN apps with just one JS app inside.
    Context context = mContextRef.get();
    if (context != null) {
      return context.getPackageName();
    }

    return null;
  }

  private void checkTaskService() throws IllegalStateException {
    if (mTaskService == null) {
      throw new IllegalStateException("Unable to find TaskService singleton module in module registry.");
    }
  }

  //endregion
}
