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
      if CMAltimeter.authorizationStatus() == .notDetermined {
        if #available(iOS 17.4, *) {
          // There's a bug in iOS 17.4 where the motion permissions popup won't display
          // even when the NSMotionUsageDescription is in the plist while using the altimeter.
          CMSensorRecorder().recordAccelerometer(forDuration: 0.1)
        }
      }

      altimeter.startRelativeAltitudeUpdates(to: operationQueue) { [weak self] data, _ in
        guard let data else {
          return
        }
        self?.sendEvent(EVENT_BAROMETER_DID_UPDATE, [
          // Given pressure needs to be converted from kPa to hPa
          "pressure": data.pressure.doubleValue * 10.0,
          "relativeAltitude": data.relativeAltitude.doubleValue,
          "timestamp": data.timestamp
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
