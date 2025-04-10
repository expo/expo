// Copyright 2024-present 650 Industries. All rights reserved.
import BackgroundTasks

public class BackgroundTaskScheduler {
  /**
   * Keep track of number of registered task consumers
   */
  static var numberOfRegisteredTasksOfThisType: Int = 0

  /**
   * Interval for task scheduler. The iOS BGTaskScheduler does not guarantee that the number of minutes will be
   * exact, but it indicates when we'd like the task to start. This will be set to at least 12 hours
   */
  private static var intervalSeconds: TimeInterval = 12 * 60 * 60

  /**
   * Call when a task is registered to keep track of how many background task consumers we have
   */
  public static func didRegisterTask(minutes: Int?) {
    if let minutes = minutes {
      intervalSeconds = Double(minutes) * 60
    }
    numberOfRegisteredTasksOfThisType += 1
  }

  /**
   * Call when a task is unregistered to keep track of how many background task consumers we have
   */
  public static func didUnregisterTask() {
    numberOfRegisteredTasksOfThisType -= 1
  }

  /**
   * Tries to schedule the worker task to run
   */
  public static func tryScheduleWorker() async throws {
    if numberOfRegisteredTasksOfThisType == 0 {
      print("Background Task: skipping scheduling. No registered tasks")
      return
    }

    // Stop existing tasks
    await stopWorker()

    // Create request
    let request = BGProcessingTaskRequest(identifier: BackgroundTaskConstants.BackgroundWorkerIdentifier)

    // We'll require network but accept running on battery power.
    request.requiresNetworkConnectivity = true
    request.requiresExternalPower = false

    // Set up mimimum start date
    request.earliestBeginDate = Date().addingTimeInterval(intervalSeconds)

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
   Cancels the worker task
   */
  public static func stopWorker() async {
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
  public static func supportsBackgroundTasks() -> Bool {
#if targetEnvironment(simulator)
    // If we're on emulator we should definetly return restricted
    return false
#else
    return true
#endif
  }
}
