package org.unimodules.interfaces.taskManager;

import java.util.Map;

// Interface for receiving task execution callbacks.
public interface TaskExecutionCallback {
  void onFinished(Map<String, Object> response);
}
