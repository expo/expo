import CoreLocation

@available(iOS 17, *)
extension CLMonitor {
  func set(regions: [GeofencingRegion]) {
    let wanted = Set(regions.map(\.identifier))
    for identifier in identifiers where !wanted.contains(identifier) {
      remove(identifier)
    }
    for region in regions {
      let condition = region.toCondition()
      if let existing = record(for: region.identifier)?.condition {
        if condition.matches(existing) {
          continue
        }
        remove(region.identifier)
      }
      add(condition, identifier: region.identifier)
    }
  }

  func forward(to shared: SharedMonitor) async {
    do {
      for try await event in events {
        let monitorEvent = MonitorEvent(event)
        shared.deliver(monitorEvent)
      }
      shared.end(nil)
    } catch {
      shared.end(error)
    }
  }
}

@available(iOS 17, *)
extension CLMonitor.CircularGeographicCondition {
  func matches(_ other: any CLCondition) -> Bool {
    switch other {
    case let circular as CLMonitor.CircularGeographicCondition:
      return circular.center.latitude == center.latitude
        && circular.center.longitude == center.longitude
        && circular.radius == radius
    default:
      return false
    }
  }
}
