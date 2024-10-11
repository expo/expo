// Copyright 2024-present 650 Industries. All rights reserved.
import ExpoModulesCore

internal final class CouldNotRegisterWorkerTask: GenericException<String> {
  override var reason: String {
    "The task could not be registered: \(param)"
  }
}

internal final class CouldNotRegisterWorker: Exception {
  override var reason: String {
    "Could not register native worker task"
  }
}

internal final class ErrorInvokingTaskHandler: Exception {
  override var reason: String {
    "An error occured when running the task handler"
  }
}


internal final class InvalidFinishTaskRun: Exception {
  override var reason: String {
    "Tried to mark task run as finished when there are no task runs active"
  }
}
