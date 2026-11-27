// Copyright 2023-present 650 Industries. All rights reserved.

import CoreLocation
import ExpoModulesCore
#if canImport(ExpoLocationObjC)
import ExpoLocationObjC
#endif

private let EVENT_LOCATION_CHANGED = "Expo.locationChanged"
private let EVENT_HEADING_CHANGED = "Expo.headingChanged"
private let EVENT_LOCATION_ERROR = "Expo.locationError"
private let EVENT_MOTION_ACTIVITY_CHANGED = "Expo.motionActivityChanged"

public final class LocationModule: Module {
  private lazy var locationStreamers = [Int: BaseStreamer]()
  private lazy var motionActivityWatches = [Int: MotionActivityWatch]()

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

    Events(EVENT_LOCATION_CHANGED, EVENT_HEADING_CHANGED, EVENT_LOCATION_ERROR, EVENT_MOTION_ACTIVITY_CHANGED)

    OnCreate {
      let permissionsManager = self.appContext?.permissions
      let requesters: [EXPermissionsRequester] = [
        EXLocationPermissionRequester(),
        EXForegroundPermissionRequester(),
        EXBackgroundLocationPermissionRequester(),
        MotionActivityPermissionRequester()
      ]
      EXPermissionsMethodsDelegate.register(requesters, withPermissionsManager: permissionsManager)
      MotionActivityRegistry.warnOnceIfCompanionIsMissing()
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
        do {
          for try await locations in try streamer.streamLocations() {
            guard let location = locations.last else {
              continue
            }
            sendEvent(EVENT_LOCATION_CHANGED, [
              "watchId": watchId,
              "location": exportLocation(location)
            ])
          }
        } catch let exception as Exception {
          sendEvent(EVENT_LOCATION_ERROR, ["watchId": watchId, "reason": exception.reason])
        } catch {
          sendEvent(EVENT_LOCATION_ERROR, ["watchId": watchId, "reason": error.localizedDescription])
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

    AsyncFunction("watchDeviceHeading") { (watchId: Int, options: HeadingOptions) in
      try ensureForegroundLocationPermissions(appContext)

      let locationOptions = LocationOptions(accuracy: .bestForNavigation, distanceInterval: 0)
      let streamer = await DeviceHeadingStreamer(options: locationOptions, headingOptions: options)

      locationStreamers[watchId] = streamer

      // Start streaming in another task, so the returned promise is not waiting for the stream to end.
      Task {
        do {
          for try await heading in try streamer.streamDeviceHeading() {
            sendEvent(EVENT_HEADING_CHANGED, [
              "watchId": watchId,
              "heading": exportHeading(heading)
            ])
          }
        } catch let exception as Exception {
          sendEvent(EVENT_LOCATION_ERROR, ["watchId": watchId, "reason": exception.reason])
        } catch {
          sendEvent(EVENT_LOCATION_ERROR, ["watchId": watchId, "reason": error.localizedDescription])
        }
      }
    }

    AsyncFunction("watchMotionActivityImplAsync") { (watchId: Int) in
      try watchMotionActivity(watchId: watchId)
    }

    AsyncFunction("removeWatchAsync") { (watchId: Int) in
      if let streamer = locationStreamers[watchId] {
        streamer.stopStreaming()
      }
      locationStreamers[watchId] = nil

      motionActivityWatches.removeValue(forKey: watchId)?.stop()
    }

    AsyncFunction("geocodeAsync") { (address: String) in
      return try await Geocoder.geocode(address: address)
    }

    AsyncFunction("reverseGeocodeAsync") { (location: CLLocation) in
      return try await Geocoder.reverseGeocode(location: location)
    }

    AsyncFunction("getMotionActivityPermissionsAsync") { (promise: Promise) in
      try getPermissionUsingRequester(MotionActivityPermissionRequester.self, appContext: appContext, promise: promise)
    }

    AsyncFunction("requestMotionActivityPermissionsAsync") { (promise: Promise) in
      try askForPermissionUsingRequester(MotionActivityPermissionRequester.self, appContext: appContext, promise: promise)
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
      // There are two ways of starting this service.
      // 1. As a background location service, this requires the background location permission.
      // 2. As a user-initiated foreground service, this does NOT require the background location permission.
      // Unfortunately, we cannot distinguish between those cases.
      // So we only check foreground permission which needs to be granted in both cases.
      try ensureLocationServicesEnabled()
      try ensureForegroundLocationPermissions(appContext)

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

    // Background motion activity

    AsyncFunction("startMotionActivityUpdatesAsync") { (taskName: String, _: [String: Any]) in
      _ = try MotionActivityRegistry.authorizedProvider()
      try taskManager.registerTask(withName: taskName, consumer: MotionActivityTaskConsumer.self, options: [:])
    }

    // Stopping and checking need no companion, so an app can stop a task it saved before the
    // companion was removed.
    AsyncFunction("stopMotionActivityUpdatesAsync") { (taskName: String) in
      let taskManager = try taskManager

      try EXUtilities.catchException {
        taskManager.unregisterTask(withName: taskName, consumerClass: MotionActivityTaskConsumer.self)
      }
    }

    AsyncFunction("hasStartedMotionActivityUpdatesAsync") { (taskName: String) -> Bool in
      return try taskManager.task(withName: taskName, hasConsumerOf: MotionActivityTaskConsumer.self)
    }
  }

  private func watchMotionActivity(watchId: Int) throws {
    let provider = try MotionActivityRegistry.authorizedProvider()
    motionActivityWatches[watchId] = provider.watchActivity(
      onActivity: { [weak self] activity in
        self?.sendEvent(EVENT_MOTION_ACTIVITY_CHANGED, ["watchId": watchId, "activity": activity])
      },
      onUnauthorized: { [weak self] in
        self?.sendEvent(EVENT_LOCATION_ERROR, ["watchId": watchId, "reason": Exceptions.MotionActivityUnauthorized().reason])
      }
    )
  }
}
