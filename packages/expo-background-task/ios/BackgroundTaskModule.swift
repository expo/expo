// Copyright 2024-present 650 Industries. All rights reserved.
import ExpoModulesCore
import BackgroundTasks

let ModuleName = "ExpoBackgroundTask"

public class BackgroundTaskModule: Module {
  
  // Static function pointer (closure) that can be set and removed containing
  // the callback into the currently loaded BackgroundTaskModule (TODO: Will there ever
  // be more than one?)
  static var invokeWork: (() async throws -> Void)?
  
  // Continuation object for syncing with JS
  private var continuation: CheckedContinuation<Void, Never>?
  
  static func registerHandler() {
    print("Expo BackgroundTask: Registering handler for %@", BackgroundTaskConstants.BackgroundWorkerIdentifier)
    let results = BGTaskScheduler.shared.register(forTaskWithIdentifier: BackgroundTaskConstants.BackgroundWorkerIdentifier, using: nil) { task in
      print("Expo BackgroundTask: Starting background task...")
      let semaphore = DispatchSemaphore(value: 0)
      Task {
        await BackgroundTaskModule.runTasks(task)
        semaphore.signal()
      }

      // Block the current thread until the semaphore is signaled
      semaphore.wait()
      print("Expo BackgroundTask: Task finished.")
    }

    if !results {
      print("Expo BackgroundTask: Failed to register handler for '%@'", BackgroundTaskConstants.BackgroundWorkerIdentifier)
    } else {
      print("Expo BackgroundTask: Handler for '%@' registered successfully", BackgroundTaskConstants.BackgroundWorkerIdentifier)
    }
  }
  
  // Handler for running tasks
  static func runTasks(_ task: BGTask) async {
    task.expirationHandler = {
      // Handle task expiration
      task.setTaskCompleted(success: false)
    }
    
    if invokeWork == nil {
      print("Expo BackgroundTask: invokeWork is nil. Could not call JS function")
      task.setTaskCompleted(success: false)
      return
    }
    
    do {
      try await invokeWork?()
    } catch {
      print("Expo BackgroundTask: invokeWork caused an error: \(error)")
      task.setTaskCompleted(success: false)
      return
    }
    
    // After completing the task
    task.setTaskCompleted(success: true)
  }
  
  func scheduleTask() throws {
    let request = BGProcessingTaskRequest(identifier: BackgroundTaskConstants.BackgroundWorkerIdentifier)
    
    // We'll require network but accept running on battery power.
    request.requiresNetworkConnectivity = true
    request.requiresExternalPower = false
    
    do {
      try BGTaskScheduler.shared.submit(request)
      
    } catch let error as BGTaskScheduler.Error {
      switch error.code {
      case .unavailable:
        throw CouldNotRegisterTask("Background task scheduling is unavailable.")
      case .tooManyPendingTaskRequests:
        throw CouldNotRegisterTask("Too many pending task requests.")
      case .notPermitted:
        throw CouldNotRegisterTask("Task request not permitted.")
      @unknown default:
        print("An unknown BGTaskScheduler error occurred.")
        // Handle any future cases added by Apple
      }
    } catch {
      // All other errors
      throw CouldNotRegisterTask("Unknown error occurred.")
    }
  }
  
  private func setInvokeWork() {
    if BackgroundTaskModule.invokeWork == nil {
      // Create the task handler
      BackgroundTaskModule.invokeWork = {
        print("Expo BackgroundTask: work is starting")
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
          self.continuation = continuation
          self.sendEvent(BackgroundTaskConstants.EVENT_PERFORM_WORK)
        }
      }
    }
  }
  
  private func clearInvokeWork() {
    BackgroundTaskModule.invokeWork = nil
  }
  
  public func definition() -> ModuleDefinition {
    Name(ModuleName)
    Events(BackgroundTaskConstants.EVENT_PERFORM_WORK)
    
    Constants(["EVENT_PERFORM_WORK": BackgroundTaskConstants.EVENT_PERFORM_WORK])
    
    OnCreate {
      setInvokeWork()
    }
    
    OnDestroy {
      if continuation != nil {
        continuation?.resume()
        continuation = nil
      }
      
      clearInvokeWork()
    }
    
    AsyncFunction("startWorkerAsync") {
      try scheduleTask()
      return true
    }
    
    AsyncFunction("stopWorkerAsync") {
      BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: BackgroundTaskConstants.BackgroundWorkerIdentifier)
      return true
    }
    
    AsyncFunction("isWorkerRunningAsync") { () async -> Bool in
      let requests = await BGTaskScheduler.shared.pendingTaskRequests()
      return requests.contains(where: { $0.identifier == BackgroundTaskConstants.BackgroundWorkerIdentifier })
    }
    
    AsyncFunction("workFinished") {
      print("Expo BackgroundTask: work has finished.")
      if let continuation = self.continuation {
        // Signal that we're done background processing
        self.continuation = nil
        continuation.resume()
        
        // Re-schedule task
        try scheduleTask()
      }
    }
    
    AsyncFunction("getStatusAsync") {
#if targetEnvironment(simulator)
      // If we're on emulator we should definetly return restricted
      return BackgroundTaskStatus.restricted.rawValue
#else
      return BackgroundTaskStatus.available
#endif
    }
  }
}
