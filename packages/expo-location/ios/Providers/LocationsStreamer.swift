// Copyright 2024-present 650 Industries. All rights reserved.

import CoreLocation
import ExpoModulesCore

internal class LocationsStreamer: BaseLocationProvider {
  typealias LocationsStream = AsyncThrowingStream<[CLLocation], Error>

  private var locationsStream: LocationsStream?
  private var continuation: LocationsStream.Continuation?

  deinit {
    stopStreaming()
  }

  func streamLocations() -> LocationsStream {
    if let stream = locationsStream {
      return stream
    }
    let stream = LocationsStream { continuation in
      self.continuation = continuation
      manager.startUpdatingLocation()
    }
    locationsStream = stream
    return stream
  }

  func stopStreaming() {
    manager.stopUpdatingLocation()
    continuation?.finish()

    locationsStream = nil
    continuation = nil
  }

  // MARK: - CLLocationManagerDelegate

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    if !locations.isEmpty {
      continuation?.yield(locations)
    }
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: any Error) {
    continuation?.finish(throwing: Exceptions.LocationUnavailable().causedBy(error))
    locationsStream = nil
    continuation = nil
  }
}
