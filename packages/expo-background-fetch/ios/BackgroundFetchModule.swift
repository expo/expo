import ExpoModulesCore

public class BackgroundFetchModule: Module {
  private lazy var taskManager: EXTaskManagerInterface? = appContext?.legacyModule(implementing: EXTaskManagerInterface.self)

  public func definition() -> ModuleDefinition {
    Name("ExpoBackgroundFetch")

    AsyncFunction("getStatusAsync") {
      return getStatus().rawValue
    }.runOnQueue(.main)

    AsyncFunction("setMinimumIntervalAsync") { (minimumInterval: Double) in
      let timeInterval = TimeInterval(minimumInterval)
      UIApplication.shared.setMinimumBackgroundFetchInterval(timeInterval)
    }.runOnQueue(.main)

    AsyncFunction("registerTaskAsync") { (name: String, options: [String: Any]) in
      guard let taskManager else {
        throw TaskManagerNotFound()
      }

      if !taskManager.hasBackgroundModeEnabled("fetch") {
        throw BackgroundFetchDisabled()
      }

      taskManager.registerTask(withName: name, consumer: BackgroundFetchTaskConsumer.self, options: options)
    }

    AsyncFunction("unregisterTaskAsync") { (name: String) in
      try EXUtilities.catchException {
        self.taskManager?.unregisterTask(withName: name, consumerClass: BackgroundFetchTaskConsumer.self)
      }
    }
  }

  private func getStatus() -> BackgroundFetchStatus {
    let backgroundRefreshStatus = UIApplication.shared.backgroundRefreshStatus
    switch backgroundRefreshStatus {
    case .restricted:
      return .restricted
    case .available:
      return .available
    case .denied:
      return .denied
    @unknown default:
      log.error("Unhandled `UIBackgroundRefreshStatus` value: \(backgroundRefreshStatus), returning `denied` as fallback. Add the missing case as soon as possible.")
      return .denied
    }
  }
}
