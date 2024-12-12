// Copyright 2024-present 650 Industries. All rights reserved.
import BackgroundTasks

@objc
public class BackgroundTaskScheduler: NSObject {
  /**
   Tries to schedule the worker task to run
   */
  public static func tryScheduleWorker() throws {
    // Create request
    let request = BGProcessingTaskRequest(identifier: BackgroundTaskConstants.BackgroundWorkerIdentifier)

    // We'll require network but accept running on battery power.
    request.requiresNetworkConnectivity = true
    request.requiresExternalPower = false

    do {
      try BGTaskScheduler.shared.submit(request)
    } catch let error as BGTaskScheduler.Error {
      switch error.code {
      case .unavailable:
        throw CouldNotRegisterWorkerTask("Background task scheduling is unavailable.")
      case .tooManyPendingTaskRequests:
        throw CouldNotRegisterWorkerTask("Too many pending task requests.")
      case .notPermitted:
        throw CouldNotRegisterWorkerTask("Task request not permitted.")
      @unknown default:
        print("An unknown BGTaskScheduler error occurred.")
        // Handle any future cases added by Apple
      }
    } catch {
      // All other errors
      throw CouldNotRegisterWorkerTask("Unknown error occurred.")
    }
  }

  /**
   Calls a private iOS API if we're in debug mode to invoke the BGTaskScheduler's worker.
   NOTE: This code is only compiled when we're in DEBUG mode!
   */
  public static func triggerTaskForTesting() {
#if DEBUG && !targetEnvironment(simulator)
    let selector = NSSelectorFromString("_simulateLaunchForTaskWithIdentifier:")
    if let method = BGTaskScheduler.shared.method(for: selector) {
      print("BackgroundTaskScheduler: calling _simulateLaunchForTaskWithIdentifier method on BGTaskScheduler")
      let implementation = unsafeBitCast(method, to: (@convention(c) (Any?, Selector, String) -> Void).self)
      implementation(BGTaskScheduler.shared, selector, BackgroundTaskConstants.BackgroundWorkerIdentifier)
    } else {
      print("BackgroundTaskScheduler: _simulateLaunchForTaskWithIdentifier method not found on BGTaskScheduler.")
    }
#endif
  }

  /**
   Cancels the worker task
   */
  public static func stopWorker() {
    BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: BackgroundTaskConstants.BackgroundWorkerIdentifier)
  }

  /**
   Returns true if the worker task is pending
   */
  public static func isWorkerRunning() async -> Bool {
    let requests = await BGTaskScheduler.shared.pendingTaskRequests()
    return requests.contains(where: { $0.identifier == BackgroundTaskConstants.BackgroundWorkerIdentifier })
  }

  /**
   Returns true if we're on a device that supports background tasks
   */
  @objc public static func supportsBackgroundTasks() -> Bool {
#if targetEnvironment(simulator)
    // If we're on emulator we should definetly return restricted
    return false
#else
    return true
#endif
  }
}
