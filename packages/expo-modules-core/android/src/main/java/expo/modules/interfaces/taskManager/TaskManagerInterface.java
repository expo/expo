package expo.modules.interfaces.taskManager;

import android.os.Bundle;

import java.util.Map;

public interface TaskManagerInterface {

  String EVENT_NAME = "TaskManager.executeTask";
  String ERR_TASK_SERVICE_NOT_FOUND = "ERR_TASK_SERVICE_NOT_FOUND";

  void registerTask(String taskName, Class consumerClass, Map<String, Object> options) throws Exception;

  void unregisterTask(String taskName, Class consumerClass) throws Exception;

  void executeTaskWithBody(Bundle body);

  boolean taskHasConsumerOfClass(String taskName, Class consumerClass);

  void flushQueuedEvents();

  String getAppId();

}
