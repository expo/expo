// Copyright 2026-present 650 Industries. All rights reserved.
import ExpoModulesCore

/**
 Errors of on-demand runs. `TaskRunner` hands them to native callers as an `NSError`,
 so they also carry their message as the localized description.
 */
internal final class OnDemandTaskException: GenericException<String>, LocalizedError, @unchecked Sendable {
  override var reason: String {
    param
  }

  var errorDescription: String? {
    param
  }

  static func invalidName() -> OnDemandTaskException {
    return OnDemandTaskException("The task name is empty. Pass the name used in TaskManager.defineTask().")
  }

  static func invalidTimeout(_ taskName: String, timeout: TimeInterval) -> OnDemandTaskException {
    return OnDemandTaskException(
      "The timeout for the task '\(taskName)' must be a positive number of seconds, but it is \(timeout)."
    )
  }

  static func nameTaken(_ taskName: String, taskType: String?) -> OnDemandTaskException {
    let owner = taskType.map { "a '\($0)' task" } ?? "another kind of task"
    return OnDemandTaskException(
      "Cannot run the task '\(taskName)' on demand because it is already registered as \(owner). "
        + "Define the on-demand task under a different name."
    )
  }

  static func timedOut(_ taskName: String, timeout: TimeInterval) -> OnDemandTaskException {
    return OnDemandTaskException(
      "The task '\(taskName)' did not finish within \(timeout) seconds. Call TaskManager.defineTask('\(taskName)', "
        + "...) in the global scope of a module imported at startup, and keep the task short. In a development "
        + "build, open the project in the app once first."
    )
  }

  static func failed(_ taskName: String, code: String?, message: String?) -> OnDemandTaskException {
    if code == "ERR_TASK_NOT_DEFINED" {
      return OnDemandTaskException(
        "The task '\(taskName)' is not defined. Call TaskManager.defineTask('\(taskName)', ...) in the global "
          + "scope of a module imported at startup."
      )
    }
    return OnDemandTaskException(
      "The task '\(taskName)' threw an error in JavaScript: \(message ?? "no message")"
    )
  }

  static func unregistered(_ taskName: String) -> OnDemandTaskException {
    return OnDemandTaskException(
      "The task '\(taskName)' was unregistered while it was running, for example because it is not defined in "
        + "JavaScript or another task took its name. Run the task again."
    )
  }
}
