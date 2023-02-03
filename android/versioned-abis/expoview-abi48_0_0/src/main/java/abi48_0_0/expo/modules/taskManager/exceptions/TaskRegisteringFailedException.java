package abi48_0_0.expo.modules.taskManager.exceptions;

public class TaskRegisteringFailedException extends Exception {
  public TaskRegisteringFailedException(Class consumerClass, Exception parentException) {
    super("Initializing task consumer '" + consumerClass.getName() + "' failed. Inherited error: " + parentException.getMessage());
  }
}
