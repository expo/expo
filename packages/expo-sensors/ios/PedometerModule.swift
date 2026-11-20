// Copyright 2023-present 650 Industries. All rights reserved.

import CoreMotion
import ExpoModulesCore

private let EVENT_PEDOMETER_UPDATE = "Exponent.pedometerUpdate"
private let EVENT_PEDOMETER_EVENT = "Exponent.pedometerEvent"

// This class should always be kept in sync with PedometerModuleDisabled
public final class PedometerModule: Module {
  private lazy var pedometer = CMPedometer()

  private var watchStartDate: Date?
  private var watchHandler: CMPedometerHandler?
  private var eventHandler: CMPedometerEventHandler?

  public func definition() -> ModuleDefinition {
    Name("ExponentPedometer")

    Events(EVENT_PEDOMETER_UPDATE, EVENT_PEDOMETER_EVENT)

    AsyncFunction("isAvailableAsync") {
      if MotionPermissionRequester.isMotionPermissionDisabled() {
        return false
      }
      return CMPedometer.isStepCountingAvailable()
    }

    AsyncFunction("isRecordingAvailableAsync") {
      // iOS keeps collecting history automatically (up to seven days), so recording is
      // effectively "available" whenever step counting is available.
      if MotionPermissionRequester.isMotionPermissionDisabled() {
        return false
      }
      return CMPedometer.isStepCountingAvailable()
    }

    AsyncFunction("isEventTrackingAvailableAsync") {
      if MotionPermissionRequester.isMotionPermissionDisabled() {
        return false
      }
      return CMPedometer.isPedometerEventTrackingAvailable()
    }

    // CoreMotion calls the event handler on its own queue, so `eventHandler` is only used on the main queue.
    AsyncFunction("startEventUpdatesAsync") { (promise: Promise) in
      if eventHandler != nil {
        promise.resolve(true)
        return
      }

      guard !MotionPermissionRequester.isMotionPermissionDisabled(),
        CMPedometer.isPedometerEventTrackingAvailable() else {
        promise.resolve(false)
        return
      }

      let authorizationStatus = CMPedometer.authorizationStatus()
      guard authorizationStatus == .authorized else {
        promise.reject(PedometerMotionPermissionException(authorizationStatus))
        return
      }

      let handler: CMPedometerEventHandler = { [weak self] event, error in
        if error != nil {
          DispatchQueue.main.async {
            self?.pedometer.stopEventUpdates()
            self?.eventHandler = nil
          }
          return
        }

        guard let self, let event else {
          return
        }

        let type: String
        switch event.type {
        case .pause:
          type = "pause"
        case .resume:
          type = "resume"
        @unknown default:
          return
        }

        self.sendEvent(
          EVENT_PEDOMETER_EVENT,
          [
            "type": type,
            "date": event.date.timeIntervalSince1970 * 1000
          ]
        )
      }

      pedometer.startEventUpdates(handler: handler)
      eventHandler = handler
      promise.resolve(true)
    }.runOnQueue(.main)

    AsyncFunction("stopEventUpdatesAsync") {
      pedometer.stopEventUpdates()
      eventHandler = nil
    }.runOnQueue(.main)

    // iOS does not expose a way to start recording history
    AsyncFunction("subscribeRecordingAsync") { (promise: Promise) in
      promise.resolve(nil)
    }

    // iOS does not expose a way to stop recording history
    AsyncFunction("unsubscribeRecordingAsync") { (promise: Promise) in
      promise.resolve(nil)
    }

    AsyncFunction("getStepCountAsync") { (startTime: Double, endTime: Double, promise: Promise) in
      let startDate = Date(timeIntervalSince1970: startTime / 1000.0)
      let endDate = Date(timeIntervalSince1970: endTime / 1000.0)

      pedometer.queryPedometerData(from: startDate, to: endDate) { data, error in
        if let error {
          promise.reject(PedometerQueryException().causedBy(error))
        } else {
          promise.resolve([
            "steps": data?.numberOfSteps ?? 0
          ])
        }
      }
    }

    AsyncFunction("getPermissionsAsync") { (promise: Promise) in
      guard let permissionsManager = appContext?.permissions else {
        return
      }
      permissionsManager.getPermissionUsingRequesterClass(
        MotionPermissionRequester.self,
        resolve: promise.legacyResolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestPermissionsAsync") { (promise: Promise) in
      guard let permissionsManager = appContext?.permissions else {
        return
      }
      permissionsManager.askForPermission(
        usingRequesterClass: MotionPermissionRequester.self,
        resolve: promise.legacyResolver,
        reject: promise.legacyRejecter
      )
    }

    OnCreate {
      guard let permissionsManager = appContext?.permissions else {
        return
      }
      permissionsManager.register([MotionPermissionRequester()])
    }

    OnStartObserving(EVENT_PEDOMETER_UPDATE) {
      let startDate = Date()
      let handler: CMPedometerHandler = { [weak self] data, _ in
        guard let data else {
          return
        }
        self?.sendEvent(EVENT_PEDOMETER_UPDATE, [
          "steps": data.numberOfSteps
        ])
      }

      pedometer.startUpdates(from: startDate, withHandler: handler)
      watchStartDate = startDate
      watchHandler = handler
    }

    OnStopObserving(EVENT_PEDOMETER_UPDATE) {
      stopUpdates()
      watchStartDate = nil
      watchHandler = nil
    }

    OnAppEntersBackground {
      stopUpdates()
    }

    OnAppEntersForeground {
      // If needed, restart updates after going back from background
      if let watchStartDate, let watchHandler {
        pedometer.startUpdates(from: watchStartDate, withHandler: watchHandler)
      }
    }

    OnDestroy {
      stopUpdates()
      pedometer.stopEventUpdates()
      eventHandler = nil
    }
  }

  private func stopUpdates() {
    guard watchHandler != nil,
      let permissions = appContext?.permissions,
      permissions.hasGrantedPermission(usingRequesterClass: MotionPermissionRequester.self) else {
      return
    }

    pedometer.stopUpdates()
  }
}

internal final class PedometerQueryException: Exception {
  override var reason: String {
    "An error occurred while querying pedometer data"
  }
}

internal final class PedometerMotionPermissionException: GenericException<CMAuthorizationStatus>, @unchecked Sendable {
  override var reason: String {
    switch param {
    case .notDetermined:
      return "Motion permission is required to start pedometer event updates. Call `Pedometer.requestPermissionsAsync()` first."
    case .denied, .restricted:
      return "Motion permission has not been granted for pedometer event updates."
    default:
      return "Motion permission is required to start pedometer event updates."
    }
  }
}
