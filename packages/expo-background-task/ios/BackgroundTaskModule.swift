
import ExpoModulesCore
import BackgroundTasks

let EVENT_PERFORM_WORK = "BackgroundTask.peformWork"

public class BackgroundTaskModule: Module {
  
  // Static function pointer (closure) that can be set and removed containing
  // the callback into the currently loaded BackgroundTaskModule (TODO: Will there ever
  // be more than one?)
  static var invokeWork: (() async -> Void)?

  // Continuation object for syncing with JS
  private var continuation: CheckedContinuation<Void, Never>?

  
  // Handler for running tasks
  static func runTasks(_ task: BGTask) async {
    task.expirationHandler = {
      // Handle task expiration
      task.setTaskCompleted(success: false)
    }

    if (invokeWork == nil) {
      NSLog("Expo BackgroundTask: invokeWork is nil. Could not call JS function")
      task.setTaskCompleted(success: false)
      return
    }
    
    await invokeWork?()

    // After completing the task
    task.setTaskCompleted(success: true)
  }
  
  func scheduleTask() throws {
    let request = BGProcessingTaskRequest(identifier: BackgroundTaskConstants.identifier)
    
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
  
  public func definition() -> ModuleDefinition {
    Name("ExpoBackgroundTask")
    Events(EVENT_PERFORM_WORK)
    Constants(["EVENT_NAME": EVENT_PERFORM_WORK])
    
    OnCreate {
      BackgroundTaskModule.invokeWork = {
        NSLog("Expo BackgroundTask: work is starting")
        await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
          self.continuation = continuation
          self.sendEvent(EVENT_PERFORM_WORK)
        }
      }
    }
    
    OnDestroy {
      if (continuation != nil) {
        continuation?.resume()
        continuation = nil
      }
      
      BackgroundTaskModule.invokeWork = nil
    }

    AsyncFunction("startWorkerAsync") {
      try scheduleTask()
      return true
    }

    AsyncFunction("stopWorkerAsync") {
      BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: BackgroundTaskConstants.identifier)
      return true
    }
    
    AsyncFunction("isWorkerRunningAsync") { () async -> Bool in
      let requests = await BGTaskScheduler.shared.pendingTaskRequests()
      return requests.contains(where: { $0.identifier == BackgroundTaskConstants.identifier })
    }
    
    AsyncFunction("workFinished") {
      NSLog("Expo BackgroundTask: work has finished.")
      if let continuation = self.continuation {
        // Signal that we're done background processing
        continuation.resume()
        self.continuation = nil
        
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

@objc(BackgroundTaskModule)
public class BackgroundTaskModuleAccessor: NSObject {
  public static var shared: BackgroundTaskModuleAccessor {
    return .init()
  }
  
  @objc public static func registerHandler() {
    NSLog("Expo BackgroundTask: Registering handler for %@", BackgroundTaskConstants.identifier);
    let results = BGTaskScheduler.shared.register(forTaskWithIdentifier: BackgroundTaskConstants.identifier, using: nil) { task in
      let semaphore = DispatchSemaphore(value: 0)
      Task {
        await BackgroundTaskModule.runTasks(task)
        semaphore.signal()
      }

      // Block the current thread until the semaphore is signaled
      semaphore.wait()
    }
    
    if (!results) {
      NSLog("Expo BackgroundTask: Failed to register handler for '%@'", BackgroundTaskConstants.identifier);
    } else {
      NSLog("Expo BackgroundTask: Handler for '%@' registered successfully", BackgroundTaskConstants.identifier);
    }
  }
}
