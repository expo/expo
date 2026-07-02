import ExpoModulesCore
import CoreLocation

protocol GeofencingMonitor: AnyObject {
  var appContext: AppContext? { get }
  func add(location: GeofencingRegion, callback: JavaScriptFunction<Void>) async -> String
  func remove(id: String) async -> Bool
  func cleanup() async -> Void
}

@available(iOS 17.0, *)
class CLMonitorGeofencing: GeofencingMonitor {
  internal weak var appContext: AppContext?
  private var callbacks: [String: (location: GeofencingRegion, callback: JavaScriptFunction<Void>)] = [:]
  private var monitorTask: Task<Void, Error>?
  private var monitor: CLMonitor?
  
  init(appContext: AppContext?) {
    self.appContext = appContext
  }
  
  private func setup() async {
    let monitor2 = await CLMonitor("ExpoGeofencing")
    self.monitor = monitor2
    
    monitorTask = Task { [weak self] in
      for try await event in await monitor2.events {
        let entry = self?.callbacks[event.identifier]
        guard let (location, callback) = entry else {
          return;
        }
        
        let geofencingEvent = GeofencingEvent(region: location, state: GeofencingRegionState(from: event.state))
        self?.appContext?.executeOnJavaScriptThread {
          try? callback.call(geofencingEvent.toDictionary(appContext: self?.appContext) as Any)
        }
      }
    }
  }
  
  internal func cleanup() async {
    for (location, _) in callbacks {
      await monitor?.remove(location)
      callbacks.removeValue(forKey: location)
    }
    monitor = nil
    monitorTask?.cancel()
    appContext = nil
  }

  func add(location: GeofencingRegion, callback: JavaScriptFunction<Void>) async -> String {
    callbacks[location.id] = (location: location, callback: callback)
    
    if monitor == nil {
      await setup()
    }
    let condition = CLMonitor.CircularGeographicCondition(center: location.clLocationCoordinate2D, radius: location.radius)
    
    await monitor?.add(condition, identifier: location.id)
    
    return location.id
  }
  
  func remove(id: String) async -> Bool {
    guard callbacks.removeValue(forKey: id) != nil else {
      return false
    }
    
    await monitor?.remove(id)
    
    if callbacks.isEmpty {
      monitor = nil
      monitorTask?.cancel()
    }
    
    return true
  }
}

class CLLocationManagerGeofencing: NSObject, GeofencingMonitor, CLLocationManagerDelegate {
  func cleanup() {
    return
  }
  
  internal weak var appContext: AppContext?
  private var callbacks: [String: JavaScriptFunction<Void>] = [:]
  private var locationManager: CLLocationManager?

  init(appContext: AppContext?) {
    self.appContext = appContext
  }
  
  func setup() {
    self.locationManager = CLLocationManager()
    self.locationManager?.delegate = self
    self.locationManager?.requestAlwaysAuthorization()
  }

  func add(location: GeofencingRegion, callback: JavaScriptFunction<Void>) -> String {
    if locationManager == nil {
      setup()
    }
    callbacks[location.id] = callback
    
    let region = CLCircularRegion(center: location.clLocationCoordinate2D, radius: location.radius, identifier: location.id)
    
    region.notifyOnEntry = true
    region.notifyOnExit = true
    
    self.locationManager?.startMonitoring(for: region)
  
    return location.id
  }

  func remove(id: String) -> Bool {
    guard callbacks.removeValue(forKey: id) != nil else { return false }

    if let region = self.locationManager?.monitoredRegions.first(where: { $0.identifier == id }) {
      self.locationManager?.stopMonitoring(for: region)
    }
    
    if callbacks.isEmpty {
      locationManager = nil
    }

    return true
  }

  // MARK: Delegate Methods
  func locationManager(_ manager: CLLocationManager, didEnterRegion region: CLRegion) {
    appContext?.executeOnJavaScriptThread {
      try? self.callbacks[region.identifier]?.call()
    }
  }

  func locationManager(_ manager: CLLocationManager, didExitRegion region: CLRegion) {
    appContext?.executeOnJavaScriptThread {
      try? self.callbacks[region.identifier]?.call()
    }
  }
}
