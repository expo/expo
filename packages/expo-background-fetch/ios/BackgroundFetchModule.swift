import ExpoModulesCore

public class BackgroundFetchModule: Module {
  private var taskManager: EXTaskManagerInterface?

  public func definition() -> ModuleDefinition {
    Name("ExpoBackgroundFetch")

    OnCreate {
      taskManager = appContext?.legacyModule(implementing: EXTaskManagerInterface.self)
    }

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

      taskManager.registerTask(withName: name, consumer: ExpoBackgroundFetchTaskConsumer.self, options: options)
    }

    AsyncFunction("unregisterTaskAsync") { (name: String) in
      taskManager?.unregisterTask(withName: name, consumerClass: ExpoBackgroundFetchTaskConsumer.self)
    }
  }

  private func getStatus() -> BackgroundFetchStatus {
    let refreshStatus = UIApplication.shared.backgroundRefreshStatus

    switch refreshStatus {
    case .restricted:
      return .restricted
    case .available:
      return .available
    case .denied:
      return .denied
    }
  }
}
