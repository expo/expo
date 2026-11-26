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

    BackgroundTaskScheduler.didRegisterTask(minutes: Self.minimumIntervalMinutes(from: task.options))
  }

  /// Reads `minimumInterval` from the task options. A value registered from JS arrives as a `Double`,
  /// one restored from the saved task config as an `NSNumber`; `as? Int` only matches the latter.
  static func minimumIntervalMinutes(from options: [AnyHashable: Any]?) -> Int? {
    // swiftlint:disable:next legacy_objc_type
    return (options?["minimumInterval"] as? NSNumber)?.intValue
  }

  func didUnregister() {
    self.task = nil

    if !BackgroundTaskScheduler.supportsBackgroundTasks() {
      return
    }

    BackgroundTaskScheduler.didUnregisterTask()
  }
}
