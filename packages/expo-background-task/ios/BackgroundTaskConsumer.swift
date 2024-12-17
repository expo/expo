// Copyright 2024-present 650 Industries. All rights reserved.
import ExpoModulesCore

class BackgroundTaskConsumer: NSObject, EXTaskConsumerInterface {
  var task: EXTaskInterface?

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

    if !BackgroundTaskScheduler.supportsBackgroundTasks() {
      return
    }

    // Safely extract "minimumInterval" from options
    if let minimumInterval = self.task?.options?["minimumInterval"] as? Int {
      BackgroundTaskScheduler.didRegisterTask(minutes: minimumInterval)
    }
  }

  func didUnregister() {
    self.task = nil

    if !BackgroundTaskScheduler.supportsBackgroundTasks() {
      return
    }

    BackgroundTaskScheduler.didUnregisterTask()
  }
}
