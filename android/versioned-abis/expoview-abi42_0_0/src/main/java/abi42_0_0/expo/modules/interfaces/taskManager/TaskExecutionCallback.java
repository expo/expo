package abi42_0_0.expo.modules.interfaces.taskManager;

import java.util.Map;

// Interface for receiving task execution callbacks.
public interface TaskExecutionCallback {
  void onFinished(Map<String, Object> response);
}
