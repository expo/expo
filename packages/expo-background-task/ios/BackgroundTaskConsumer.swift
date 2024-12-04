import ExpoModulesCore

class BackgroundTaskConsumer: NSObject, EXTaskConsumerInterface {
  var task: EXTaskInterface?
  static var numberOfRegisteredTasksOfThisType: Int = 0

  static func supportsLaunchReason(_ launchReason: EXTaskLaunchReason) -> Bool {
    return launchReason == EXTaskLaunchReasonBackgroundTask
  }

  func taskType() -> String {
    return "backgroundTask"
  }

  func normalizeTaskResult(_ result: Any?) -> UInt {
    guard let result = result as? Int else {
      return UIBackgroundFetchResult.noData.rawValue
    }

    switch result {
    case BackgroundTaskResult.success.rawValue:
      return UIBackgroundFetchResult.newData.rawValue
    case BackgroundTaskResult.failed.rawValue:
      return UIBackgroundFetchResult.failed.rawValue
    default:
      return UIBackgroundFetchResult.newData.rawValue
    }
  }

  func didBecomeReadyToExecute(withData data: [AnyHashable: Any]?) {
    // Run on main thread. The task execution needs to be called on the main thread
    // since it accesses the UIApplication's state
    EXUtilities.performSynchronously {
      self.task?.execute(withData: data, withError: nil)
    }
  }

  func didRegisterTask(_ task: EXTaskInterface) {
    self.task = task
    
    if (!BackgroundTaskScheduler.supportsBackgroundTasks()) {
      return
    }

    BackgroundTaskConsumer.numberOfRegisteredTasksOfThisType += 1
    
    // Ensure that the the BGTask is running
    Task {
      if await !BackgroundTaskScheduler.isWorkerRunning() {
        // Start worker
        try BackgroundTaskScheduler.tryScheduleWorker()
      }
    }
  }

  func didUnregister() {
    self.task = nil
    
    if (!BackgroundTaskScheduler.supportsBackgroundTasks()) {
      return
    }
    
    BackgroundTaskConsumer.numberOfRegisteredTasksOfThisType -= 1

    // Stop worker only if this was the last task registered
    if BackgroundTaskConsumer.numberOfRegisteredTasksOfThisType == 0 {
      // Stop worker
      BackgroundTaskScheduler.stopWorker()
    }
  }
}
