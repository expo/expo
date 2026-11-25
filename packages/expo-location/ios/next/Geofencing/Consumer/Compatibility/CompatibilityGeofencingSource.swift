import CoreLocation

private let maxMonitoredRegions = 20

private struct Monitored {
  let region: CLCircularRegion
  var lastState: CLRegionState?
  var hasRetried = false
}

final class CompatibilityGeofencingSource: NSObject, GeofencingSource, CLLocationManagerDelegate {
  let updates: AsyncThrowingStream<GeofencingEvent, Error>

  private let continuation: AsyncThrowingStream<GeofencingEvent, Error>.Continuation
  private let manager: CLLocationManager
  private let namespace: String
  private var monitored: [String: Monitored] = [:]
  private let lock = NSLock()
  private var ended = false

  init(options: GeofencingTaskOptions) {
    let (stream, continuation) = AsyncThrowingStream.makeStream(of: GeofencingEvent.self)
    self.continuation = continuation
    self.updates = stream
    self.manager = CLLocationManager.makeOnMainThread()
    self.namespace = options.name + "/"
    super.init()

    manager.delegate = self
    DispatchQueue.main.async {
      self.startMonitoring(options.regions)
    }
  }

  var hasEnded: Bool {
    lock.withLock { ended }
  }

  func locationManager(_ manager: CLLocationManager, didDetermineState state: CLRegionState, for region: CLRegion) {
    guard let entry = monitored[region.identifier], entry.lastState != state,
      let eventState = GeofencingEventState(state) else {
      return
    }
    monitored[region.identifier]?.lastState = state
    let identifier = localIdentifier(of: region)
    let event = GeofencingEvent(identifier: identifier, state: eventState, date: Date())
    continuation.yield(event)
  }

  func locationManager(_ manager: CLLocationManager, monitoringDidFailFor region: CLRegion?, withError error: any Error) {
    guard let region, monitored[region.identifier] != nil else {
      return
    }
    let all = manager.monitoredRegions
    switch error {
    case CLError.regionMonitoringDenied:
      let error = LocationAuthorizationDenied()
      end(error)
    case CLError.regionMonitoringSetupDelayed, CLError.regionMonitoringResponseDelayed:
      return
    case is CLError where all.count >= maxMonitoredRegions && !all.contains(region):
      let error = GeofencingRegionLimitExceeded()
      end(error)
    case is CLError where monitored[region.identifier]?.hasRetried == false:
      monitored[region.identifier]?.hasRetried = true
      manager.stopMonitoring(for: region)
      manager.startMonitoring(for: region)
      manager.requestState(for: region)
    case is CLError:
      let identifier = localIdentifier(of: region)
      let error = GeofencingRegionUnmonitored(identifier)
      end(error)
    default:
      return
    }
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: any Error) {
    guard case CLError.denied = error, !CLLocationManager.locationServicesEnabled() else {
      return
    }
    let error = LocationServicesDisabledGlobally()
    end(error)
  }

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    switch manager.authorizationStatus {
    case .denied where !CLLocationManager.locationServicesEnabled():
      let error = LocationServicesDisabledGlobally()
      end(error)
    case .denied:
      let error = LocationAuthorizationDenied()
      end(error)
    case .restricted:
      let error = LocationAuthorizationRestricted()
      end(error)
    default:
      return
    }
  }

  func setRegions(_ regions: [GeofencingRegion]) {
    DispatchQueue.main.async {
      let wanted = Set(regions.map { region in self.namespace + region.identifier })
      for identifier in self.monitored.keys where !wanted.contains(identifier) {
        self.stopMonitoring(identifier)
      }
      self.startMonitoring(regions)
    }
  }

  func stop() {
    DispatchQueue.main.async {
      self.stopMonitoringAll()
      self.end(nil)
    }
  }

  private func end(_ error: Error?) {
    lock.withLock {
      ended = true
    }
    continuation.finish(throwing: error)
  }

  private func startMonitoring(_ regions: [GeofencingRegion]) {
    for region in regions {
      let identifier = namespace + region.identifier
      let circularRegion = region.toCircularRegion(identifier: identifier)
      if let existing = monitored[identifier]?.region {
        let unchanged = existing.center.latitude == circularRegion.center.latitude
          && existing.center.longitude == circularRegion.center.longitude
          && existing.radius == circularRegion.radius
        if unchanged {
          continue
        }
        stopMonitoring(identifier)
      }
      monitored[identifier] = Monitored(region: circularRegion)
      manager.startMonitoring(for: circularRegion)
      manager.requestState(for: circularRegion)
    }
  }

  private func stopMonitoring(_ identifier: String) {
    guard let entry = monitored.removeValue(forKey: identifier) else {
      return
    }
    manager.stopMonitoring(for: entry.region)
  }

  private func stopMonitoringAll() {
    for identifier in monitored.keys {
      stopMonitoring(identifier)
    }
  }

  private func localIdentifier(of region: CLRegion) -> String {
    String(region.identifier.dropFirst(namespace.count))
  }
}

extension GeofencingEventState {
  init?(_ state: CLRegionState) {
    switch state {
    case .inside:
      self = .inside
    case .outside:
      self = .outside
    case .unknown:
      return nil
    @unknown default:
      return nil
    }
  }
}
