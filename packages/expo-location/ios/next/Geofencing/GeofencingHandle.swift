import CoreLocation
import ExpoModulesCore

final class GeofencingHandle: SharedObject {
  let taskName: String
  private let accessGuard: LocationAccessGuard

  init(taskName: String, accessGuard: LocationAccessGuard) {
    self.taskName = taskName
    self.accessGuard = accessGuard
  }

  func start(regions: [GeofencingRegion]) throws {
    try validateMonitorName(taskName)
    try validateRegions(regions)
    try validateUniqueIdentifiers(regions)

    guard CLLocationManager.locationServicesEnabled() else {
      throw LocationServicesDisabledGlobally()
    }
    try accessGuard.checkPermissions(.background)

    let options = GeofencingTaskOptions(name: taskName, regions: regions)
    try taskManager().registerTask(
      withName: taskName,
      consumer: GeofencingConsumer.self,
      options: options.toDictionary()
    )
  }

  func stop() throws {
    let taskManager = try taskManager()
    guard taskManager.task(withName: taskName, hasConsumerOf: GeofencingConsumer.self) else {
      return
    }
    taskManager.unregisterTask(withName: taskName, consumerClass: GeofencingConsumer.self)
  }

  func hasStarted() throws -> Bool {
    return try taskManager().task(withName: taskName, hasConsumerOf: GeofencingConsumer.self)
  }

  private func taskManager() throws -> EXTaskManagerInterface {
    guard let taskManager: EXTaskManagerInterface = appContext?.legacyModule(implementing: EXTaskManagerInterface.self) else {
      throw TaskManagerUnavailable()
    }
    return taskManager
  }

  private func validateMonitorName(_ name: String) throws {
    let hasOnlyASCIIAlphanumerics = name.allSatisfy { character in
      return character.isASCII && (character.isLetter || character.isNumber)
    }
    guard !name.isEmpty && hasOnlyASCIIAlphanumerics else {
      throw GeofencingTaskNameInvalid(name)
    }
  }

  private func validateRegions(_ regions: [GeofencingRegion]) throws {
    for region in regions {
      guard region.isValid else {
        throw GeofencingRegionInvalid(region.identifier)
      }
    }
  }

  private func validateUniqueIdentifiers(_ regions: [GeofencingRegion]) throws {
    var identifiers = Set<String>()

    for region in regions {
      if identifiers.contains(region.identifier) {
        throw GeofencingRegionInvalid(region.identifier)
      }

      identifiers.insert(region.identifier)
    }
  }
}
