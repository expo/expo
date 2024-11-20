// Copyright 2024-present 650 Industries. All rights reserved.
import BackgroundTasks

class BackgroundTaskService {
  /**
   Startup argument that will cause us to simulate starting from the background
   */
  private static let EXPO_RUN_BACKGROUND_TASK = "EXPO_RUN_BACKGROUND_TASK"
  
  /**
   Static function pointer (closure) that can be set and removed containing
   the callback into the currently loaded BackgroundTaskModule
   */
  private static var runTasksHandler: (() async throws -> Void)?
  
  /*
   Continuation object for syncing with JS
  */
  private static var runTasksContinuation: CheckedContinuation<Void, Never>?
  
  /**
   Initialize and register the handler for our background service with the OS. If there is no
   BackgroundTaskModule loaded we'll just store our continuation object so that the module
   can use it when the module is correctly initialised.
   
   This method will also check for the process argument `EXPO_RUN_BACKGROUND_TASK` which
   can be used to simulate running a background task.
   */
  static func register() throws {
    print("ExpoBackgroundTask: Registering handler...")
    
    // 1. Check if we have the EXPO_RUN_BACKGROUND_TASK flag set
    let shouldSimulateBackgroundStart = ProcessInfo.processInfo.arguments.contains(BackgroundTaskService.EXPO_RUN_BACKGROUND_TASK)
    
    // 2. Register the callback
    let registrationResults = BGTaskScheduler.shared.register(forTaskWithIdentifier: BackgroundTaskConstants.BackgroundWorkerIdentifier,
                                                              using: nil,
                                                              launchHandler: launchHandler)
    
    // 3. Check the registration results
    if !registrationResults {
      throw CouldNotRegisterWorker()
    } else {
      print("ExpoBackgroundTask: Handler registered successfully")
      
      // 4. Now we can check if we are supposed to simulate the background task
      if shouldSimulateBackgroundStart {
        // Let's run the simulation in the background
        Task.detached {
          return try await tryCallTaskHandler()
        }
      }
    }
  }
  
  /**
   This function should be called when the BackgroundTaskModule is notified by JS that the task runner has
   finished. We'll then notify the waiting task handler about this
   */
  static func markTaskAsFinished() throws {
    print("ExpoBackgroundTask: Marking task as finished")
    if let continuation = BackgroundTaskService.runTasksContinuation {
      // resume the continuation so that we can "free" the task worker.
      continuation.resume()
      
      // Set the continuation object to nil
      BackgroundTaskService.runTasksContinuation = nil
      
    } else {
      // This should never happen - one shouldn't mark a task that was never finished
      // as done...
      throw InvalidFinishTaskRun()
    }
  }
  
  /**
   Sets the callback function that is called when the background task handler is called from the OS.
   If this function is not set we'll set the runTaskContinunation object and wait until everything is loaded
   The BackgroundTaskModule will then check for the continuation object and perform a task run when ready.
   
   Should be called from the BackgroundTaskModule's onCreate callback.
   
   This function will also check if there is any tasks waiting - and call the task handler if it is
   
   NOTE: If there is already a handler we won't set it again - setting should be symmetric and follow the onCreate/onDestroy
   from the calling module
   */
  static func setRunTasksHandler(_ handler: @escaping () async throws -> Void) {
    print("ExpoBackgroundTask: setting task handler callback")
    // 1. Only set the handler when no handler is set
    if BackgroundTaskService.runTasksHandler == nil {
      // 2. Save the handler
      BackgroundTaskService.runTasksHandler = handler
    }
  }
  
  /**
   If we have a continuation object and a task handler we're pending a task run and should schedule it.
   The BackgroundTaskModule should perform this check when it starts the worker caused by one or more
   JS tasks being waiting
   */
  static func checkForPendingTaskWorkerRequests() async {
    print("ExpoBackgroundTask: Checking for pending task requests")
    // Check if we should call it if there are any pending tasks
    if BackgroundTaskService.runTasksContinuation != nil {
      print("ExpoBackgroundTask: Found pending task requests")
      if let handler = BackgroundTaskService.runTasksHandler {
        // It is super important to run this on a separate thread since it might
        // take a lot of time
        Task.detached {
          do {
            try await handler()
          } catch {
            print("ExpoBackgroundTask: runTasksHandler caused an error: \(error)")
          }
        }
      } else {
        print("ExpoBackgroundTask: pending task found, no handler registered to run it")
      }
    } else {
      print("ExpoBackgroundTask: no pending task requests found")
    }
  }
  
  /**
   Clears the runTaskHandler. This should be done from the BackgroundTaskModule's onDestroy callback so that it is
   symmetric with the setRunTasksHandler
   */
  static func clearRunTasksHandler() {
    print("ExpoBackgroundTask: Clearing task handler callback")
    BackgroundTaskService.runTasksHandler = nil
  }
  
  /**
   Returns true if background tasks are supported
   */
  static func isBackgroundTaskSupported() -> Bool {
#if targetEnvironment(simulator)
      // If we're on emulator we should definetly return restricted
      return false
#else
      return true
#endif
  }
  
  /**
   Checks to see if we have a runTaskHandler - which means that we're already initialised and have a valid
   appContext - we can just call it directly. If not we'll just create the continuation object and let the module
   grab it when it is loaded.
   */
  private static func tryCallTaskHandler() async throws {
    print("ExpoBackgroundTask: Setting up continuation and optionally calling handler")
    // 1. Create continuation object
    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      // Save continuation object
      BackgroundTaskService.runTasksContinuation = continuation
      
      // 2. Check if the handler is set
      if let handler = runTasksHandler {
        // 3. Call the handler
        print("ExpoBackgroundTask: Calling handler")
        Task.detached {
          try await handler()
        }
      } else {
        print("ExpoBackgroundTask: Did not call handler since it was not set.")
      }
    }
  }
      
  /**
   LaunchHandler for the BGTaskScheduler. This function is passed to the registration code of the BGTaskScheduler on startup.
   The function will not return until we've
   */
  private static func launchHandler(_ task: BGTask) {
    print("ExpoBackgroundTask: Callback from OS for background task")
    
    // Check if we're already waiting here
    if BackgroundTaskService.runTasksContinuation != nil {
      // TODO: What should we do...!? We're already running.... Just return task completed?
      print("ExpoBackgroundTask: Already running - this task will be ignored")
      task.setTaskCompleted(success: true)
      return
    }
    
    // Create a semaphore so that this function acts as a blocking function
    // untill the JS side is done.
    let semaphore = DispatchSemaphore(value: 0)
    Task {
      do {
        try await tryCallTaskHandler()
        task.setTaskCompleted(success: true)
      } catch {
        task.setTaskCompleted(success: false)
      }
      semaphore.signal()
    }

    // Block the current thread until the semaphore is signaled
    semaphore.wait()
  }
}

/**
 This is a little helper class so that we can access the BackgroundTaskService from objective-c,
 specifically from our AppDelegate callback.
 */
@objc(BackgroundTaskService)
public class BackgroundTaskServiceAccessor: NSObject {
  
  @objc public static func register() -> Bool {
    do {
      try BackgroundTaskService.register()
      return true
    } catch {
      return false
    }
  }
  
  @objc public static func supportsBackgroundTasks() -> Bool {
    return BackgroundTaskService.isBackgroundTaskSupported()
  }
}
