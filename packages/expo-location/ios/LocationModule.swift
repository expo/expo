// Copyright 2023-present 650 Industries. All rights reserved.

import CoreLocation
import ExpoModulesCore

private let EVENT_LOCATION_CHANGED = "Expo.locationChanged"
private let EVENT_HEADING_CHANGED = "Expo.headingChanged"

public final class LocationModule: Module {
  private lazy var locationStreamers = [Int: BaseLocationProvider]()

  private var taskManager: EXTaskManagerInterface {
    get throws {
      guard let taskManager: EXTaskManagerInterface = appContext?.legacyModule(implementing: EXTaskManagerInterface.self) else {
        throw Exceptions.TaskManagerUnavailable()
      }
      return taskManager
    }
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoLocation")

    Events(EVENT_LOCATION_CHANGED, EVENT_HEADING_CHANGED)

    OnCreate {
      let permissionsManager = self.appContext?.permissions
      EXPermissionsMethodsDelegate.register(
        [
          EXLocationPermissionRequester(),
          EXForegroundPermissionRequester(),
          EXBackgroundLocationPermissionRequester()
        ],
        withPermissionsManager: permissionsManager
      )
    }

    AsyncFunction("getProviderStatusAsync") {
      return [
        "locationServicesEnabled": CLLocationManager.locationServicesEnabled(),
        "backgroundModeEnabled": true
      ]
    }

    AsyncFunction("getCurrentPositionAsync") { (options: LocationOptions) -> [String: Any] in
      try ensureForegroundLocationPermissions(appContext)

      let requester = await LocationRequester(options: options)
      let location = try await requester.requestLocation()

      return exportLocation(location)
    }

    AsyncFunction("watchPositionImplAsync") { (watchId: Int, options: LocationOptions) in
      try ensureForegroundLocationPermissions(appContext)

      let streamer = await LocationsStreamer(options: options)

      locationStreamers[watchId] = streamer

      // Start streaming in another task, so the returned promise is not waiting for the stream to end.
      Task {
        for try await locations in streamer.streamLocations() {
          guard let location = locations.last else {
            continue
          }
          sendEvent(EVENT_LOCATION_CHANGED, [
            "watchId": watchId,
            "location": exportLocation(location)
          ])
        }
      }
    }

    AsyncFunction("getLastKnownPositionAsync") { (requirements: LastKnownLocationRequirements) -> [String: Any]? in
      try ensureForegroundLocationPermissions(appContext)

      if let location = CLLocationManager().location, isLocation(location, valid: requirements) {
        return exportLocation(location)
      }
      return nil
    }

    AsyncFunction("watchDeviceHeading") { (watchId: Int) in
      try ensureForegroundLocationPermissions(appContext)

      let options = LocationOptions(accuracy: .bestForNavigation, distanceInterval: 0)
      let streamer = await DeviceHeadingStreamer(options: options)

      locationStreamers[watchId] = streamer

      // Start streaming in another task, so the returned promise is not waiting for the stream to end.
      Task {
        for try await heading in streamer.streamDeviceHeading() {
          sendEvent(EVENT_HEADING_CHANGED, [
            "watchId": watchId,
            "heading": [
              "trueHeading": heading.trueHeading,
              "magHeading": heading.magneticHeading,
              "accuracy": normalizeAccuracy(heading.headingAccuracy)
            ]
          ])
        }
      }
    }

    AsyncFunction("removeWatchAsync") { (watchId: Int) in
      locationStreamers[watchId] = nil
    }

    AsyncFunction("geocodeAsync") { (address: String) in
      return try await Geocoder.geocode(address: address)
    }

    AsyncFunction("reverseGeocodeAsync") { (location: CLLocation) in
      return try await Geocoder.reverseGeocode(location: location)
    }

    AsyncFunction("getPermissionsAsync") { (promise: Promise) in
      try getPermissionUsingRequester(EXLocationPermissionRequester.self, appContext: appContext, promise: promise)
    }

    AsyncFunction("requestPermissionsAsync") { (promise: Promise) in
      try askForPermissionUsingRequester(EXLocationPermissionRequester.self, appContext: appContext, promise: promise)
    }

    AsyncFunction("getForegroundPermissionsAsync") { (promise: Promise) in
      try getPermissionUsingRequester(EXForegroundPermissionRequester.self, appContext: appContext, promise: promise)
    }

    AsyncFunction("requestForegroundPermissionsAsync") { (promise: Promise) in
      try askForPermissionUsingRequester(EXForegroundPermissionRequester.self, appContext: appContext, promise: promise)
    }

    AsyncFunction("getBackgroundPermissionsAsync") { (promise: Promise) in
      try getPermissionUsingRequester(EXBackgroundLocationPermissionRequester.self, appContext: appContext, promise: promise)
    }

    AsyncFunction("requestBackgroundPermissionsAsync") { (promise: Promise) in
      try askForPermissionUsingRequester(EXBackgroundLocationPermissionRequester.self, appContext: appContext, promise: promise)
    }

    AsyncFunction("hasServicesEnabledAsync") {
      return CLLocationManager.locationServicesEnabled()
    }

    // Background location

    AsyncFunction("startLocationUpdatesAsync") { (taskName: String, options: [String: Any]) in
      try ensureLocationServicesEnabled()
      try ensureForegroundLocationPermissions(appContext)
      try ensureBackgroundLocationPermissions(appContext)

      guard CLLocationManager.significantLocationChangeMonitoringAvailable() else {
        throw Exceptions.LocationUpdatesUnavailable()
      }
      guard try taskManager.hasBackgroundModeEnabled("location") else {
        throw Exceptions.LocationUpdatesUnavailable()
      }

      try taskManager.registerTask(withName: taskName, consumer: EXLocationTaskConsumer.self, options: options)
    }

    AsyncFunction("stopLocationUpdatesAsync") { (taskName: String) in
      let taskManager = try taskManager

      try EXUtilities.catchException {
        taskManager.unregisterTask(withName: taskName, consumerClass: EXLocationTaskConsumer.self)
      }
    }

    AsyncFunction("hasStartedLocationUpdatesAsync") { (taskName: String) -> Bool in
      return try taskManager.task(withName: taskName, hasConsumerOf: EXLocationTaskConsumer.self)
    }

    // Geofencing

    AsyncFunction("startGeofencingAsync") { (taskName: String, options: [String: Any]) in
      try ensureBackgroundLocationPermissions(appContext)

      guard CLLocationManager.isMonitoringAvailable(for: CLCircularRegion.self) else {
        throw Exceptions.GeofencingUnavailable()
      }
      guard try taskManager.hasBackgroundModeEnabled("location") else {
        throw Exceptions.LocationUpdatesUnavailable()
      }

      try taskManager.registerTask(withName: taskName, consumer: EXGeofencingTaskConsumer.self, options: options)
    }

    AsyncFunction("stopGeofencingAsync") { (taskName: String) in
      let taskManager = try taskManager

      try EXUtilities.catchException {
        taskManager.unregisterTask(withName: taskName, consumerClass: EXGeofencingTaskConsumer.self)
      }
    }

    AsyncFunction("hasStartedGeofencingAsync") { (taskName: String) -> Bool in
      return try taskManager.task(withName: taskName, hasConsumerOf: EXGeofencingTaskConsumer.self)
    }
  }
}
