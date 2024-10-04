// Copyright 2023-present 650 Industries. All rights reserved.

import CoreMotion
import ExpoModulesCore

private let EVENT_PEDOMETER_UPDATE = "Exponent.pedometerUpdate"

// This class should always be kept in sync with PedometerModuleDisabled
public final class PedometerModule: Module {
  private lazy var pedometer = CMPedometer()

  private var watchStartDate: Date?
  private var watchHandler: CMPedometerHandler?

  public func definition() -> ModuleDefinition {
    Name("ExponentPedometer")

    Events(EVENT_PEDOMETER_UPDATE)

    AsyncFunction("isAvailableAsync") {
      return CMPedometer.isStepCountingAvailable()
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
        self?.sendEvent(EVENT_PEDOMETER_UPDATE, [
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
    }
  }

  private func stopUpdates() {
    guard watchHandler != nil,
      let permissions = appContext?.permissions,
      permissions.hasGrantedPermission(usingRequesterClass: EXMotionPermissionRequester.self) else {
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
