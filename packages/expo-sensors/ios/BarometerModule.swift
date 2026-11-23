// Copyright 2023-present 650 Industries. All rights reserved.

import CoreMotion
import ExpoModulesCore

// `@Event` needs a string literal, so it repeats this name.
private let EVENT_BAROMETER_DID_UPDATE = "barometerDidUpdate"

@ExpoModule("ExpoBarometer")
public final class BarometerModule: Module {
  private lazy var altimeter = CMAltimeter()
  private lazy var operationQueue = OperationQueue()
  // `willDestroy` can run on any thread.
  private let isObserving = Mutex(false)

  @Event("barometerDidUpdate")
  var onBarometerUpdate: (BarometerEvent) -> Void

  @JS
  func isAvailableAsync() async -> Bool {
    return CMAltimeter.isRelativeAltitudeAvailable()
  }

  @JS
  func setUpdateInterval(intervalMs: Double) async {
    // Nothing we can do
  }

  public override func didStartListening(event: String) {
    guard event == EVENT_BAROMETER_DID_UPDATE else {
      return
    }
    if CMAltimeter.authorizationStatus() == .notDetermined {
      if #available(iOS 17.4, *) {
        // There's a bug in iOS 17.4 where the motion permissions popup won't display
        // even when the NSMotionUsageDescription is in the plist while using the altimeter.
        CMSensorRecorder().recordAccelerometer(forDuration: 0.1)
      }
    }

    isObserving.withLock { $0 = true }
    altimeter.startRelativeAltitudeUpdates(to: operationQueue) { [weak self] data, _ in
      guard let data else {
        return
      }
      self?.onBarometerUpdate(BarometerEvent(
        // Given pressure needs to be converted from kPa to hPa
        pressure: data.pressure.doubleValue * 10.0,
        relativeAltitude: data.relativeAltitude.doubleValue,
        timestamp: data.timestamp
      ))
    }
  }

  public override func didStopListening(event: String) {
    guard event == EVENT_BAROMETER_DID_UPDATE else {
      return
    }
    stopUpdates()
  }

  public override func willDestroy() {
    stopUpdates()
  }

  private func stopUpdates() {
    let wasObserving = isObserving.withLock { isObserving in
      defer { isObserving = false }
      return isObserving
    }
    if wasObserving {
      altimeter.stopRelativeAltitudeUpdates()
    }
  }
}
