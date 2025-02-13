// Copyright 2024-present 650 Industries. All rights reserved.
import ExpoModulesCore

internal final class BackgroundTasksNotConfigured: Exception {
  override var reason: String {
    "Background Task has not been configured. To enable it, add `process` to `UIBackgroundModes` in the application's Info.plist file"
  }
}

internal final class BackgroundTasksRestricted: Exception {
  override var reason: String {
#if targetEnvironment(simulator)
    "Background Task is not available on simulators. Use a device to test it."
#else
    "Background Task is not available in the current context."
#endif
  }
}

internal final class TaskManagerNotFound: Exception {
  override var reason: String {
    "TaskManager not found. Are you sure that Expo modules are properly linked?"
  }
}

internal final class CouldNotRegisterWorkerTask: GenericException<String> {
  override var reason: String {
    "Expo BackgroundTasks: The task could not be registered: \(param)"
  }
}

internal final class CouldNotRegisterWorker: Exception {
  override var reason: String {
    "Expo BackgroundTasks: Could not register native worker task"
  }
}

internal final class ErrorInvokingTaskHandler: Exception {
  override var reason: String {
    "Expo BackgroundTasks: An error occured when running the task handler"
  }
}

internal final class InvalidFinishTaskRun: Exception {
  override var reason: String {
    "Expo BackgroundTasks: Tried to mark task run as finished when there are no task runs active"
  }
}
