import ExpoModulesCore

class BackgroundFetchTaskConsumer: NSObject, EXTaskConsumerInterface {
  var task: EXTaskInterface?

  static func supportsLaunchReason(_ launchReason: EXTaskLaunchReason) -> Bool {
    return launchReason == EXTaskLaunchReasonBackgroundFetch
  }

  func taskType() -> String {
    return "backgroundFetch"
  }

  func didRegisterTask(_ task: EXTaskInterface) {
    self.task = task
    updateMinimumInterval()
  }

  func setOptions(_ options: [AnyHashable: Any]) {
    updateMinimumInterval()
  }

  func didBecomeReadyToExecute(withData data: [AnyHashable: Any]?) {
    task?.execute(withData: nil, withError: nil)
  }

  func normalizeTaskResult(_ result: Any?) -> UInt {
    guard let result = result as? Int else {
      return UIBackgroundFetchResult.noData.rawValue
    }

    switch result {
    case BackgroundFetchResult.newData.rawValue:
      return UIBackgroundFetchResult.newData.rawValue
    case BackgroundFetchResult.failed.rawValue:
      return UIBackgroundFetchResult.failed.rawValue
    case BackgroundFetchResult.noData.rawValue:
      return UIBackgroundFetchResult.noData.rawValue
    default:
      return UIBackgroundFetchResult.noData.rawValue
    }
  }

  private func updateMinimumInterval() {
    let interval = task?.options?["minimumInterval"] as? Double

    let timeInterval = {
      if let interval {
        return TimeInterval(interval)
      }
      return UIApplication.backgroundFetchIntervalMinimum
    }()

    DispatchQueue.main.async {
      UIApplication.shared.setMinimumBackgroundFetchInterval(timeInterval)
    }
  }
}
