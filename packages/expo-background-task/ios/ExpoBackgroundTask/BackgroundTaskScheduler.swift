// Copyright 2024-present 650 Industries. All rights reserved.
import BackgroundTasks
import Foundation

protocol BackgroundTaskScheduling: Sendable {
  func cancel(taskRequestWithIdentifier identifier: String)
  func submit(_ request: BGProcessingTaskRequest) throws
  func pendingTaskRequests() async -> [BGTaskRequest]
}

private struct SystemBackgroundTaskScheduler: BackgroundTaskScheduling {
  func cancel(taskRequestWithIdentifier identifier: String) {
    BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: identifier)
  }

  func submit(_ request: BGProcessingTaskRequest) throws {
    try BGTaskScheduler.shared.submit(request)
  }

  func pendingTaskRequests() async -> [BGTaskRequest] {
    return await BGTaskScheduler.shared.pendingTaskRequests()
  }
}

public class BackgroundTaskScheduler {
  /**
   A one-time async gate that becomes ready after BGTaskScheduler registration finishes.
   Multiple awaiters will be resumed when ready; subsequent awaiters return immediately.
   */
  private actor RegistrationGate {
    private var ready: Bool = false
    private var waiters: [CheckedContinuation<Void, Never>] = []

    func awaitReady() async {
      if ready { return }
      await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
        if ready {
          continuation.resume()
        } else {
          waiters.append(continuation)
        }
      }
    }

    func signalReady() {
      guard !ready else { return }
      ready = true
      let continuations = waiters
      waiters.removeAll()
      for c in continuations {
        c.resume()
      }
    }
  }

  /**
   Registration gate that will only be signaled when the bgTaskSchedulerDidFinishRegister is called.
   */
  private static let registrationGate = RegistrationGate()

  private actor SchedulerState {
    private var scheduler: BackgroundTaskScheduling = SystemBackgroundTaskScheduler()
    private var numberOfRegisteredTasksOfThisType: Int = 0
    private var intervalSeconds: TimeInterval = 12 * 60 * 60

    func didRegisterTask(minutes: Int?) -> Bool {
      if let minutes = minutes {
        intervalSeconds = Double(minutes) * 60
      }
      numberOfRegisteredTasksOfThisType += 1

      return numberOfRegisteredTasksOfThisType == 1
    }

    func didUnregisterTask() -> Bool {
      numberOfRegisteredTasksOfThisType = max(0, numberOfRegisteredTasksOfThisType - 1)
      return numberOfRegisteredTasksOfThisType == 0
    }

    func hasRegisteredTasks() -> Bool {
      return numberOfRegisteredTasksOfThisType > 0
    }

    func scheduleWorker() throws {
      if numberOfRegisteredTasksOfThisType == 0 {
        print("Background Task: skipping scheduling. No registered tasks")
        return
      }

      stopWorkerOnce()

      let request = BGProcessingTaskRequest(identifier: BackgroundTaskConstants.BackgroundWorkerIdentifier)
      request.requiresNetworkConnectivity = true
      request.requiresExternalPower = false
      request.earliestBeginDate = Date().addingTimeInterval(intervalSeconds)

      do {
        try scheduler.submit(request)
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
        }
      } catch {
        throw CouldNotRegisterWorkerTask("Unknown error occurred.")
      }
    }

    func stopWorker() {
      stopWorkerOnce()
    }

    func isWorkerRunning() async -> Bool {
      let requests = await scheduler.pendingTaskRequests()
      return requests.contains(where: { $0.identifier == BackgroundTaskConstants.BackgroundWorkerIdentifier })
    }

    func setSchedulerForTesting(_ scheduler: BackgroundTaskScheduling) {
      self.scheduler = scheduler
    }

    func resetForTesting(registeredTaskCount: Int = 0) {
      scheduler = SystemBackgroundTaskScheduler()
      numberOfRegisteredTasksOfThisType = registeredTaskCount
      intervalSeconds = 12 * 60 * 60
    }

    private func stopWorkerOnce() {
      scheduler.cancel(taskRequestWithIdentifier: BackgroundTaskConstants.BackgroundWorkerIdentifier)
    }
  }

  private static let schedulerState = SchedulerState()

  /**
   Call from the BackgroundTaskAppDelegate after the call to BGTaskScheduler.shared.register has finished
   so that we can hold back any tryScheduleWorker calls, especially the call to BGTaskScheduler.shared.submit
   that will fail if called before the BGTaskScheduler has successfully registered its handler.
   */
  public static func bgTaskSchedulerDidFinishRegister() {
    Task {
      await registrationGate.signalReady()
    }
  }

  /**
   * Call when a task is registered to keep track of how many background task consumers we have
   */
  public static func didRegisterTask(minutes: Int?) {
    Task {
      if await schedulerState.didRegisterTask(minutes: minutes) {
        try await tryScheduleWorker()
      }
    }
  }

  /**
   * Call when a task is unregistered to keep track of how many background task consumers we have
   */
  public static func didUnregisterTask() {
    Task {
      if await schedulerState.didUnregisterTask() {
        await stopWorker()
      }
    }
  }

  /**
   * Tries to schedule the worker task to run
   */
  public static func tryScheduleWorker() async throws {
    if await !schedulerState.hasRegisteredTasks() {
      print("Background Task: skipping scheduling. No registered tasks")
      return
    }

    // Wait until BGTaskScheduler registration has completed.
    await registrationGate.awaitReady()

    try await schedulerState.scheduleWorker()
  }

  /**
   Cancels the worker task
   */
  public static func stopWorker() async {
    await schedulerState.stopWorker()
  }

  /**
   Returns true if the worker task is pending
   */
  public static func isWorkerRunning() async -> Bool {
    return await schedulerState.isWorkerRunning()
  }

  static func setSchedulerForTesting(_ scheduler: BackgroundTaskScheduling) async {
    await schedulerState.setSchedulerForTesting(scheduler)
  }

  static func resetForTesting(registeredTaskCount: Int = 0) async {
    await schedulerState.resetForTesting(registeredTaskCount: registeredTaskCount)
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
