import CoreLocation

@available(iOS 17, *)
extension CLMonitor {
  func set(regions: [GeofencingRegion]) {
    for identifier in identifiers {
      remove(identifier)
    }
    for region in regions {
      let condition = region.toCondition()
      add(condition, identifier: region.identifier)
    }
  }

  func forward(to shared: SharedMonitor) async {
    do {
      for try await event in events {
        shared.deliver(event)
      }
      shared.end(nil)
    } catch {
      shared.end(error)
    }
  }
}
