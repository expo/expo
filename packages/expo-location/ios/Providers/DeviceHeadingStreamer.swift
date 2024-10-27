// Copyright 2024-present 650 Industries. All rights reserved.

import CoreLocation
import ExpoModulesCore

internal class DeviceHeadingStreamer: BaseLocationProvider {
  typealias DeviceHeadingStream = AsyncThrowingStream<CLHeading, Error>

  private var headingStream: DeviceHeadingStream?
  private var continuation: DeviceHeadingStream.Continuation?

  deinit {
    stopStreaming()
  }

  func streamDeviceHeading() -> DeviceHeadingStream {
    if let stream = headingStream {
      return stream
    }
    let stream = DeviceHeadingStream { continuation in
      self.continuation = continuation
      manager.startUpdatingHeading()
    }
    headingStream = stream
    return stream
  }

  func stopStreaming() {
    manager.stopUpdatingHeading()
    continuation?.finish()

    headingStream = nil
    continuation = nil
  }

  // MARK: - CLLocationManagerDelegate

  func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
    continuation?.yield(newHeading)
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: any Error) {
    // TODO: Make HeadingUnavailableException
    continuation?.finish(throwing: Exceptions.LocationUnavailable().causedBy(error))
    headingStream = nil
    continuation = nil
  }
}
