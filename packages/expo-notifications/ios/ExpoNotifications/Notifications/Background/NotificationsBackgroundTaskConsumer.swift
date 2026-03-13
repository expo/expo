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
    guard let result = result as? UInt else {
      return UIBackgroundFetchResult.noData.rawValue
    }

    return switch result {
    case UIBackgroundFetchResult.newData.rawValue:
      UIBackgroundFetchResult.newData.rawValue
    case UIBackgroundFetchResult.failed.rawValue:
      UIBackgroundFetchResult.failed.rawValue
    default:
      UIBackgroundFetchResult.noData.rawValue
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
