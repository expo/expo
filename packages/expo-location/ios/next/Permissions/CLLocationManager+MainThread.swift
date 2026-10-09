import CoreLocation

extension CLLocationManager {
  static func makeOnMainThread() -> CLLocationManager {
    if Thread.isMainThread {
      return CLLocationManager()
    }
    return DispatchQueue.main.sync { CLLocationManager() }
  }
}
