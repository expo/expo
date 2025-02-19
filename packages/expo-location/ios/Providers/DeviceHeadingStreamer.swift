// Copyright 2024-present 650 Industries. All rights reserved.

import CoreLocation
import ExpoModulesCore

internal class DeviceHeadingStreamer: BaseStreamer {
  typealias DeviceHeadingStream = AsyncThrowingStream<CLHeading, Error>

  private var headingStream: DeviceHeadingStream?
  private var continuation: DeviceHeadingStream.Continuation?

  deinit {
    if continuation != nil {
      stopStreaming()
    }
  }

  func streamDeviceHeading() throws -> DeviceHeadingStream {
    if !CLLocationManager.headingAvailable() {
      // Throw error
      throw Exceptions.HeadingUnavailableException()
    }
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

  override func stopStreaming() {
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
    continuation?.finish(throwing: Exceptions.HeadingUnavailableException().causedBy(error))
    headingStream = nil
    continuation = nil
  }
}
