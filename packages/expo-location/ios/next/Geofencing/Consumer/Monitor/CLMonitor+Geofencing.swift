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
}
