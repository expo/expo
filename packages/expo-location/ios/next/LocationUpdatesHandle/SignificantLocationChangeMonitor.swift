import CoreLocation

final class SignificantLocationChangeMonitor {
  private var manager: CLLocationManager?

  func start() {
    DispatchQueue.main.async {
      let manager = self.manager ?? CLLocationManager()
      self.manager = manager
      manager.startMonitoringSignificantLocationChanges()
    }
  }

  func stop() {
    DispatchQueue.main.async {
      self.manager?.stopMonitoringSignificantLocationChanges()
      self.manager = nil
    }
  }
}
