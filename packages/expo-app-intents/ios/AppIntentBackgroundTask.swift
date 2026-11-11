import ExpoModulesCore
import Foundation

/// Thrown by `runBackgroundTask(name:)` when expo-task-manager, which runs the task, is not in the app.
internal final class BackgroundTaskUnavailableException: GenericException<String>, LocalizedError, @unchecked Sendable {
  override var reason: String {
    #if os(macOS)
    // expo-task-manager has no macOS pod, so installing it would not help.
    "expo-app-intents could not run the background task '\(param)' because background tasks are not available "
      + "on macOS: expo-task-manager, which runs JavaScript tasks on demand, supports only iOS and tvOS. On "
      + "macOS, hand the invocation to JavaScript with dispatch(name:params:) instead."
    #else
    "expo-app-intents could not run the background task '\(param)' because expo-task-manager is not "
      + "installed, and it is what runs JavaScript tasks on demand. Install it with "
      + "`npx expo install expo-task-manager`, then rebuild the app."
    #endif
  }

  var errorDescription: String? {
    reason
  }
}

/// Runs JavaScript tasks on demand. expo-task-manager provides it as `EXTaskRunner`.
internal typealias AppIntentTaskRunner = any EXTaskRunnerInterface

extension AppIntentDispatcher {
  /// The Objective-C name of the runner that expo-task-manager provides.
  private static let taskRunnerClassName = "EXTaskRunner"

  /// Finds the expo-task-manager runner at runtime. Neither pod depends on the other, so the class is
  /// only there when the app also installs expo-task-manager, and a prebuilt pod cannot check for it
  /// when it is compiled.
  internal static func discoverTaskRunner() -> AppIntentTaskRunner? {
    guard let runnerClass = NSClassFromString(taskRunnerClassName) as? NSObject.Type else {
      return nil
    }
    return runnerClass.init() as? AppIntentTaskRunner
  }

  /// Runs the JavaScript task `taskName`, defined with `TaskManager.defineTask` in the global scope, and
  /// returns the value it resolved with. The task gets an `AppIntentInvocation` with a new `id` as its
  /// `data`, and the invocation is not added to the pending queue.
  ///
  /// Requires expo-task-manager (iOS and tvOS). Throws when the task fails, is not defined, or does
  /// not finish within `timeout`, and with `CancellationError` when the calling task is cancelled.
  public func runBackgroundTask(
    name taskName: String,
    params: AppIntentParams = [:],
    timeout: Duration = .seconds(30)
  ) async throws -> AppIntentValue {
    try Task.checkCancellation()
    guard let taskRunner else {
      throw BackgroundTaskUnavailableException(taskName)
    }
    let data = AppIntentInvocation(name: taskName, params: params).toDict()
    let seconds = Double(timeout.components.seconds) + Double(timeout.components.attoseconds) / 1e18

    // Whichever comes first, the runner's answer or the cancellation, takes the continuation, so it is
    // resumed exactly once. A runner that answers after the caller gave up is ignored.
    let pending = Mutex<CheckedContinuation<AppIntentValue, any Error>?>(nil)
    return try await withTaskCancellationHandler {
      try await withCheckedThrowingContinuation { continuation in
        pending.withLock { $0 = continuation }
        // Cancelled between the check above and storing the continuation: the handler already ran.
        if Task.isCancelled {
          pending.withLock { $0.take() }?.resume(throwing: CancellationError())
          return
        }
        taskRunner.runTask(withName: taskName, data: data, timeout: seconds) { result, error in
          let outcome: Result<AppIntentValue, any Error>
          if let error {
            outcome = .failure(error)
          } else {
            outcome = Result { try AppIntentValue(foundationValue: result) }
          }
          pending.withLock { $0.take() }?.resume(with: outcome)
        }
      }
    } onCancel: {
      pending.withLock { $0.take() }?.resume(throwing: CancellationError())
    }
  }
}
