package expo.modules.taskManager;

import android.content.Context;
import android.os.Bundle;
import android.util.Log;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import expo.core.ModuleRegistry;
import expo.core.interfaces.InternalModule;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.EventEmitter;
import expo.interfaces.constants.ConstantsInterface;
import expo.interfaces.taskManager.TaskConsumerInterface;
import expo.interfaces.taskManager.TaskServiceInterface;
import expo.interfaces.taskManager.TaskManagerInterface;

public class TaskManagerInternalModule implements InternalModule, ModuleRegistryConsumer, TaskManagerInterface {
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
    return Arrays.<Class>asList(TaskManagerInterface.class);
  }

  //endregion
  //region ModuleRegistryConsumer

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mEventEmitter = moduleRegistry.getModule(EventEmitter.class);
    mConstants = moduleRegistry.getModule(ConstantsInterface.class);
    mTaskService = moduleRegistry.getSingletonModule("TaskService", TaskServiceInterface.class);

    // Register in TaskService.
    mTaskService.setTaskManager(this, getAppId(), getAppUrl());
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
  public void executeTaskWithBody(Bundle body) {
    if (mEventsQueue != null) {
      // `startObserving` on TaskManagerModule wasn't called yet - add event body to the queue.
      mEventsQueue.add(body);
    } else {
      // Manager is already being observed by JS app, so we can execute the event immediately.
      mEventEmitter.emit(TaskManagerModule.EVENT_NAME, body);
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
  public void flushQueuedEvents() {
    // Execute any events that came before this call.
    if (mEventsQueue != null) {
      for (Bundle body : mEventsQueue) {
        mEventEmitter.emit(TaskManagerModule.EVENT_NAME, body);
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

  @Override
  public boolean isRunningInHeadlessMode() {
    if (mConstants != null) {
      return (boolean) mConstants.getConstants().get("isHeadless");
    }
    return false;
  }

  //endregion
  //region helpers

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
