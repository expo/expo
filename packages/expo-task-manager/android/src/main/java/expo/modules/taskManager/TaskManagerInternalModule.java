package expo.modules.taskManager;

import android.content.Context;
import android.os.Bundle;
import android.util.Log;

import expo.modules.core.ModuleRegistry;
import expo.modules.core.interfaces.InternalModule;
import expo.modules.core.interfaces.LifecycleEventListener;
import expo.modules.core.interfaces.services.UIManager;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import expo.modules.interfaces.constants.ConstantsInterface;
import expo.modules.interfaces.taskManager.TaskConsumerInterface;
import expo.modules.interfaces.taskManager.TaskManagerInterface;
import expo.modules.interfaces.taskManager.TaskServiceInterface;

public class TaskManagerInternalModule implements InternalModule, TaskManagerInterface, LifecycleEventListener {
  private UIManager mUIManager;
  private ConstantsInterface mConstants;
  private TaskServiceInterface mTaskService;
  private WeakReference<Context> mContextRef;
  private List<Bundle> mEventsQueue = new ArrayList<>();
  private EmitEventWrapper mEmitEventWrapper;

  public TaskManagerInternalModule(Context context) {
    mContextRef = new WeakReference<>(context);
  }

  //region InternalModule

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList(TaskManagerInterface.class);
  }

  public void setEmitEventWrapper(EmitEventWrapper emitEventWrapper) {
    mEmitEventWrapper = emitEventWrapper;
  }

  //endregion
  //region ModuleRegistryConsumer

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mUIManager = moduleRegistry.getModule(UIManager.class);
    mConstants = moduleRegistry.getModule(ConstantsInterface.class);
    mTaskService = moduleRegistry.getSingletonModule("TaskService", TaskServiceInterface.class);

    // Register in TaskService.
    mTaskService.setTaskManager(this, getAppScopeKey(), getAppUrl());

    mUIManager.registerLifecycleEventListener(this);
  }

  @Override
  public void onDestroy() {
    mUIManager.unregisterLifecycleEventListener(this);
    mTaskService.setTaskManager(null, getAppScopeKey(), getAppUrl());
  }

  //endregion
  //region TaskManagerInterface

  @Override
  public void registerTask(String taskName, Class consumerClass, Map<String, Object> options) throws Exception {
    checkTaskService();
    mTaskService.registerTask(taskName, getAppScopeKey(), getAppUrl(), consumerClass, options);
  }

  @Override
  public void unregisterTask(String taskName, Class consumerClass) throws Exception {
    checkTaskService();
    mTaskService.unregisterTask(taskName, getAppScopeKey(), consumerClass);
  }

  @Override
  public synchronized void executeTaskWithBody(Bundle body) {
    if (mEventsQueue != null) {
      // `startObserving` on TaskManagerModule wasn't called yet - add event body to the queue.
      mEventsQueue.add(body);
    } else {
      // Manager is already being observed by JS app, so we can execute the event immediately.
      emitEvent(body);
    }
  }

  @Override
  public boolean taskHasConsumerOfClass(String taskName, Class consumerClass) {
    if (mTaskService == null) {
      return false;
    }
    return mTaskService.taskHasConsumerOfClass(taskName, getAppScopeKey(), consumerClass);
  }

  @Override
  public synchronized void flushQueuedEvents() {
    // Execute any events that came before this call.
    if (mEventsQueue != null) {
      for (Bundle body : mEventsQueue) {
        emitEvent(body);
      }
      mEventsQueue = null;
    }
  }

  @Override
  public String getAppScopeKey() {
    if (mConstants != null) {
      return mConstants.getAppScopeKey();
    }
    return null;
  }
  //endregion
  //region LifecycleEventListener

  @Override
  public void onHostResume() {
    if (!isRunningInHeadlessMode()) {
      List<TaskConsumerInterface> taskConsumers = mTaskService.getTaskConsumers(getAppScopeKey());
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
      List<TaskConsumerInterface> taskConsumers = mTaskService.getTaskConsumers(getAppScopeKey());
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
      List<TaskConsumerInterface> taskConsumers = mTaskService.getTaskConsumers(getAppScopeKey());
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
    return mTaskService.isStartedByHeadlessLoader(getAppScopeKey());
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

  private void emitEvent(Bundle body) {
    if (mEmitEventWrapper != null) {
      mEmitEventWrapper.emit(TaskManagerInterface.EVENT_NAME, body);
    } else {
      Log.e("ExpoTaskManager", "EmitEventWrapper is not set. Failed to emit the TaskManager Event.");
    }
  }

  //endregion
}
