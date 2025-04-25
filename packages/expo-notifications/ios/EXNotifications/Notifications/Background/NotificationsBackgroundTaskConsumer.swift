// Copyright 2024-present 650 Industries. All rights reserved.
import ExpoModulesCore

class NotificationsBackgroundTaskConsumer: NSObject, EXTaskConsumerInterface {
  var task: EXTaskInterface?

  static func supportsLaunchReason(_ launchReason: EXTaskLaunchReason) -> Bool {
    return launchReason == EXTaskLaunchReasonRemoteNotification
  }

  func taskType() -> String {
    return "remote-notification"
  }

  func normalizeTaskResult(_ result: Any?) -> UInt {
    guard let result = result as? Int else {
      return UIBackgroundFetchResult.noData.rawValue
    }

    switch result {
    case BackgroundNotificationResult.newData.rawValue:
      return UIBackgroundFetchResult.newData.rawValue
    case BackgroundNotificationResult.failed.rawValue:
      return UIBackgroundFetchResult.failed.rawValue
    default:
      return UIBackgroundFetchResult.noData.rawValue
    }
  }

  func didBecomeReadyToExecute(withData data: [AnyHashable: Any]?) {
    let result = BackgroundEventTransformer.transform(data)
    self.task?.execute(withData: result, withError: nil)
  }

  func didRegisterTask(_ task: EXTaskInterface) {
    self.task = task
  }

  func didUnregister() {
    self.task = nil
  }
}

enum BackgroundNotificationResult: Int, Enumerable {
  case noData = 1
  case newData = 2
  case failed = 3
}
