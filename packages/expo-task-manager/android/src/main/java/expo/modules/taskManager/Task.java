package expo.modules.taskManager;

import android.os.Bundle;

import java.util.Map;

import expo.interfaces.taskManager.TaskExecutionCallback;
import expo.interfaces.taskManager.TaskServiceInterface;
import expo.interfaces.taskManager.TaskConsumerInterface;
import expo.interfaces.taskManager.TaskInterface;

public class Task implements TaskInterface {
  private String mName;
  private String mAppId;
  private String mAppUrl;
  private TaskConsumerInterface mConsumer;
  private Map<String, Object> mOptions;
  private TaskServiceInterface mService;

  public Task(String name, String appId, String appUrl, TaskConsumerInterface consumer, Map<String, Object> options, TaskServiceInterface service) {
    mName = name;
    mAppId = appId;
    mAppUrl = appUrl;
    mConsumer = consumer;
    mOptions = options;
    mService = service;
  }

  public String getName() {
    return mName;
  }

  public String getAppId() {
    return mAppId;
  }

  public String getAppUrl() {
    return mAppUrl;
  }

  public TaskConsumerInterface getConsumer() {
    return mConsumer;
  }

  public Map<String, Object> getOptions() {
    return mOptions;
  }

  public Bundle getOptionsBundle() {
    return TaskManagerUtils.mapToBundle(mOptions);
  }

  public void execute(Bundle data, Error error) {
    execute(data, error, null);
  }

  public void execute(Bundle data, Error error, TaskExecutionCallback callback) {
    mService.executeTask(this, data, error, callback);
  }

  public void setOptions(Map<String, Object> options) {
    mOptions = options;
  }
}
