// Copyright 2024-present 650 Industries. All rights reserved.

import CoreLocation

internal class BaseLocationProvider: NSObject, CLLocationManagerDelegate {
  internal let manager = CLLocationManager()

  // CLLocationManager must be created on the main thread.
  @MainActor
  init(options: LocationOptions) {
    super.init()
    manager.allowsBackgroundLocationUpdates = false
    manager.distanceFilter = options.distanceInterval
    manager.desiredAccuracy = options.accuracy.toCLLocationAccuracy()
    manager.delegate = self
  }
}
