package abi49_0_0.expo.modules.taskManager.exceptions;

public class InvalidConsumerClassException extends Exception {
  public InvalidConsumerClassException(String taskName) {
    super("Invalid task consumer. Cannot unregister task with name '" + taskName + "' because it is associated with different consumer class.");
  }
}
