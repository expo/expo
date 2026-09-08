import CoreLocation
import ExpoModulesCore

final class LocationUpdatesHandle: SharedObject {
  var taskName: String
  private var profile: Profile = .default
  private let accessGuard: LocationAccessGuard

  init(taskName: String, accessGuard: LocationAccessGuard) {
    self.taskName = taskName
    self.accessGuard = accessGuard
  }

  func withProfile(_ profile: Profile) {
    self.profile = profile
  }

  func start() throws {
    guard CLLocationManager.locationServicesEnabled() else {
      throw LocationServicesDisabledGlobally()
    }
    try accessGuard.checkForegroundPermissions()
    guard CLLocationManager.significantLocationChangeMonitoringAvailable() else {
      throw SignificantLocationChangesUnavailable()
    }
    let taskManager = try taskManager()
    guard taskManager.hasBackgroundModeEnabled("location") else {
      throw MissingLocationBackgroundMode()
    }

    taskManager.registerTask(
      withName: taskName,
      consumer: LocationUpdatesTaskConsumer.self,
      options: LocationUpdatesTaskOptions(profile: profile).toDictionary()
    )
  }

  func stop() throws {
    try taskManager().unregisterTask(withName: taskName, consumerClass: LocationUpdatesTaskConsumer.self)
  }

  func hasStarted() throws -> Bool {
    return try taskManager().hasRegisteredTask(withName: taskName)
  }

  private func taskManager() throws -> EXTaskManagerInterface {
    guard let taskManager: EXTaskManagerInterface = appContext?.legacyModule(implementing: EXTaskManagerInterface.self) else {
      throw TaskManagerUnavailable()
    }
    return taskManager
  }
}
