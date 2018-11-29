package expo.modules.taskManager.exceptions;

public class InvalidConsumerClassException extends Exception {
  public InvalidConsumerClassException(String taskName) {
    super("Cannot unregister task with name '" + taskName + "' because it is associated with different consumer class.");
  }
}
