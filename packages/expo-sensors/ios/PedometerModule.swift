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
      return CMPedometer.isStepCountingAvailable()
    }

    AsyncFunction("isRecordingAvailableAsync") {
      // iOS keeps collecting history automatically (up to seven days) and doesn't
      // expose a Recording API toggle like Android does, so report this as
      // unavailable to let the JS layer skip `subscribeRecording` calls.
      return false
    }

    AsyncFunction("startEventUpdates") { (promise: Promise) in
      if eventHandler != nil {
        promise.resolve(true)
        return
      }

      guard CMPedometer.isPedometerEventTrackingAvailable() else {
        promise.resolve(false)
        return
      }

      let handler: CMPedometerEventHandler = { [weak self] event, _ in
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

      pedometer.startEventUpdates(withHandler: handler)
      eventHandler = handler
      promise.resolve(true)
    }

    AsyncFunction("stopEventUpdates") {
      pedometer.stopEventUpdates()
      eventHandler = nil
    }

    // iOS does not expose a way to start recording history
    AsyncFunction("subscribeRecording") { (promise: Promise) in
      promise.resolve(nil)
    }

    // iOS does not expose a way to stop recording history
    AsyncFunction("unsubscribeRecording") { (promise: Promise) in
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
        EXMotionPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    AsyncFunction("requestPermissionsAsync") { (promise: Promise) in
      guard let permissionsManager = appContext?.permissions else {
        return
      }
      permissionsManager.askForPermission(
        usingRequesterClass: EXMotionPermissionRequester.self,
        resolve: promise.resolver,
        reject: promise.legacyRejecter
      )
    }

    OnCreate {
      guard let permissionsManager = appContext?.permissions else {
        return
      }
      permissionsManager.register([EXMotionPermissionRequester()])
    }

    OnStartObserving {
      let startDate = Date()
      let handler: CMPedometerHandler = { [weak self] data, _ in
        guard let data else {
          return
        }
        self?.sendEvent(
          EVENT_PEDOMETER_UPDATE,
          [
            "steps": data.numberOfSteps
          ])
      }

      pedometer.startUpdates(from: startDate, withHandler: handler)
      watchStartDate = startDate
      watchHandler = handler
    }

    OnStopObserving {
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
      permissions.hasGrantedPermission(usingRequesterClass: EXMotionPermissionRequester.self)
    else {
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
