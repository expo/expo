package org.unimodules.interfaces.taskManager;

import android.content.Context;
import android.os.Bundle;

import org.unimodules.core.interfaces.Consumer;

import java.util.Map;

public interface TaskManagerInterface {

  String EVENT_NAME = "TaskManager.executeTask";
  String E_TASK_SERVICE_NOT_FOUND = "E_TASK_SERVICE_NOT_FOUND";

  void registerTask(String taskName, Class consumerClass, Map<String, Object> options) throws Exception;

  void unregisterTask(String taskName, Class consumerClass) throws Exception;

  void loadApp(Context context, Object params, Runnable alreadyRunning, Consumer<Boolean> callback) throws IllegalArgumentException, IllegalStateException;

  boolean invalidateApp(String appId);

  void executeTaskWithBody(Bundle body);

  boolean taskHasConsumerOfClass(String taskName, Class consumerClass);

  void flushQueuedEvents();

  String getAppId();

}
