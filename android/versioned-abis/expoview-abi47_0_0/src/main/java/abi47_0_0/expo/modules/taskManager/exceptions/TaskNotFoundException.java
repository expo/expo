package abi47_0_0.expo.modules.taskManager.exceptions;

public class TaskNotFoundException extends Exception {
  public TaskNotFoundException(String taskName, String appId) {
    super("Task '" + taskName + "' not found for app ID '" + appId + "'.");
  }
}
