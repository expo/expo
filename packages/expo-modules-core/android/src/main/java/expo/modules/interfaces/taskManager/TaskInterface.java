package expo.modules.interfaces.taskManager;

import android.os.Bundle;

import java.util.Map;

public interface TaskInterface {
  String getName();
  String getAppId();
  String getAppUrl();
  TaskConsumerInterface getConsumer();
  Map<String, Object> getOptions();
  Bundle getOptionsBundle();

  // Executes the task with given data and error.
  void execute(Bundle data, Error error);

  // Same as above but also provides a callback that is invoked
  // when the JavaScript app has finished executing the task.
  void execute(Bundle data, Error error, TaskExecutionCallback callback);

  // Sets options for the task.
  void setOptions(Map<String, Object> options);
}
