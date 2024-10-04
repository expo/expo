// Copyright 2023-present 650 Industries. All rights reserved.

import CoreMotion
import ExpoModulesCore

private let EVENT_BAROMETER_DID_UPDATE = "barometerDidUpdate"

public final class BarometerModule: Module {
  private lazy var altimeter = CMAltimeter()
  private lazy var operationQueue = OperationQueue()

  public func definition() -> ModuleDefinition {
    Name("ExpoBarometer")

    Events(EVENT_BAROMETER_DID_UPDATE)

    AsyncFunction("isAvailableAsync") {
      return CMAltimeter.isRelativeAltitudeAvailable()
    }

    AsyncFunction("setUpdateInterval") { (_: Double) in
      // Nothing we can do
    }

    OnStartObserving {
      altimeter.startRelativeAltitudeUpdates(to: operationQueue) { [weak self] data, _ in
        guard let data else {
          return
        }
        self?.sendEvent(EVENT_BAROMETER_DID_UPDATE, [
          // Given pressure needs to be converted from kPa to hPa
          "pressure": data.pressure.doubleValue * 10.0,
          "relativeAltitude": data.relativeAltitude.doubleValue
        ])
      }
    }

    OnStopObserving {
      altimeter.stopRelativeAltitudeUpdates()
    }

    OnDestroy {
      altimeter.stopRelativeAltitudeUpdates()
    }
  }
}
