package org.unimodules.interfaces.taskManager;

import android.os.Bundle;

import java.util.Map;

public interface TaskManagerInterface {
  void registerTask(String taskName, Class consumerClass, Map<String, Object> options) throws Exception;

  void unregisterTask(String taskName, Class consumerClass) throws Exception;

  void executeTaskWithBody(Bundle body);

  boolean taskHasConsumerOfClass(String taskName, Class consumerClass);

  void flushQueuedEvents();

  String getAppId();

  boolean isRunningInHeadlessMode();
}
