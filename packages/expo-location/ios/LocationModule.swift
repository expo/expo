// Copyright 2023-present 650 Industries. All rights reserved.

import CoreLocation
import CoreMotion
import ExpoModulesCore

private let EVENT_LOCATION_CHANGED = "Expo.locationChanged"
private let EVENT_HEADING_CHANGED = "Expo.headingChanged"
private let EVENT_LOCATION_ERROR = "Expo.locationError"
private let EVENT_MOTION_ACTIVITY_CHANGED = "Expo.motionActivityChanged"

/// Builds a permission-response dictionary from the current CMMotionActivity authorization status.
private func motionActivityPermissionResponse() -> [String: Any] {
  let status = CMMotionActivityManager.authorizationStatus()
  switch status {
  case .authorized:
    return ["status": "granted", "granted": true, "canAskAgain": true, "expires": "never"]
  case .denied:
    return ["status": "denied", "granted": false, "canAskAgain": false, "expires": "never"]
  case .restricted:
    return ["status": "denied", "granted": false, "canAskAgain": false, "expires": "never"]
  case .notDetermined:
    return ["status": "undetermined", "granted": false, "canAskAgain": true, "expires": "never"]
  @unknown default:
    return ["status": "undetermined", "granted": false, "canAskAgain": true, "expires": "never"]
  }
}

public final class LocationModule: Module {
  private lazy var locationStreamers = [Int: BaseStreamer]()
  private lazy var motionActivityStreamers = [Int: MotionActivityStreamer]()

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

    AsyncFunction("watchDeviceHeading") { (watchId: Int) in
      try ensureForegroundLocationPermissions(appContext)

      let options = LocationOptions(accuracy: .bestForNavigation, distanceInterval: 0)
      let streamer = await DeviceHeadingStreamer(options: options)

      locationStreamers[watchId] = streamer

      // Start streaming in another task, so the returned promise is not waiting for the stream to end.
      Task {
        do {
          for try await heading in try streamer.streamDeviceHeading() {
            sendEvent(EVENT_HEADING_CHANGED, [
              "watchId": watchId,
              "heading": [
                "trueHeading": heading.trueHeading,
                "magHeading": heading.magneticHeading,
                "accuracy": normalizeAccuracy(heading.headingAccuracy)
              ]
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
      guard CMMotionActivityManager.isActivityAvailable() else {
        throw Exceptions.MotionActivityUnavailable()
      }
      let authorizationStatus = CMMotionActivityManager.authorizationStatus()
      guard authorizationStatus != .denied && authorizationStatus != .restricted else {
        throw Exceptions.MotionActivityUnauthorized()
      }

      let streamer = MotionActivityStreamer()
      motionActivityStreamers[watchId] = streamer

      // Start streaming in a detached task so the returned promise resolves immediately.
      Task {
        do {
          for try await activity in try streamer.streamMotionActivity() {
            // CMMotionActivity reports one confidence value for the whole reading.
            // Detected entries receive that confidence; undetected entries receive 0 (Low).
            let confidence = activity.confidence.rawValue
            func entry(_ detected: Bool) -> [String: Any] {
              ["detected": detected, "confidence": detected ? confidence : 0]
            }
            sendEvent(EVENT_MOTION_ACTIVITY_CHANGED, [
              "watchId": watchId,
              "activity": [
                "activities": [
                  "automotive": entry(activity.automotive),
                  "cycling":    entry(activity.cycling),
                  "running":    entry(activity.running),
                  "walking":    entry(activity.walking),
                  "stationary": entry(activity.stationary),
                  "unknown":    entry(activity.unknown),
                ],
                "timestamp": activity.startDate.timeIntervalSince1970 * 1000
              ]
            ])
          }
        } catch let exception as Exception {
          sendEvent(EVENT_LOCATION_ERROR, ["watchId": watchId, "reason": exception.reason])
        } catch {
          sendEvent(EVENT_LOCATION_ERROR, ["watchId": watchId, "reason": error.localizedDescription])
        }
      }
    }

    AsyncFunction("removeWatchAsync") { (watchId: Int) in
      if let streamer = locationStreamers[watchId] {
        streamer.stopStreaming()
      }
      locationStreamers[watchId] = nil

      if let streamer = motionActivityStreamers[watchId] {
        streamer.stopStreaming()
      }
      motionActivityStreamers[watchId] = nil
    }

    AsyncFunction("geocodeAsync") { (address: String) in
      return try await Geocoder.geocode(address: address)
    }

    AsyncFunction("reverseGeocodeAsync") { (location: CLLocation) in
      return try await Geocoder.reverseGeocode(location: location)
    }

    AsyncFunction("getMotionActivityPermissionsAsync") { () -> [String: Any] in
      return motionActivityPermissionResponse()
    }

    AsyncFunction("requestMotionActivityPermissionsAsync") { () -> [String: Any] in
      guard CMMotionActivityManager.isActivityAvailable() else {
        return motionActivityPermissionResponse()
      }
      let status = CMMotionActivityManager.authorizationStatus()
      guard status == .notDetermined else {
        return motionActivityPermissionResponse()
      }
      // Issuing a short historical query is the standard way to trigger the system
      // Motion and Fitness permission prompt when the status is .notDetermined.
      let manager = CMMotionActivityManager()
      await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
        manager.queryActivityStarting(from: Date(timeIntervalSinceNow: -1), to: Date(), to: .main) { _, _ in
          continuation.resume()
        }
      }
      return motionActivityPermissionResponse()
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
