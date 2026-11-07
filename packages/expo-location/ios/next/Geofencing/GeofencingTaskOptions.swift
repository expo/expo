import ExpoModulesCore

struct GeofencingTaskOptions {
  let name: String
  let regions: [GeofencingRegion]

  init(name: String, regions: [GeofencingRegion]) {
    self.name = name
    self.regions = regions
  }

  init(name: String, dictionary: [AnyHashable: Any]?) {
    self.name = name
    let rawRegions = dictionary?["regions"] as? [[AnyHashable: Any]] ?? []
    regions = rawRegions.compactMap { raw in
      guard
        let identifier = raw["identifier"] as? String,
        let latitude = raw["latitude"] as? Double,
        let longitude = raw["longitude"] as? Double,
        let radius = raw["radius"] as? Double
      else {
        return nil
      }
      let region = GeofencingRegion()
      region.identifier = identifier
      region.latitude = latitude
      region.longitude = longitude
      region.radius = radius
      return region
    }
  }

  func toDictionary() -> [String: Any] {
    ["regions": regions.map { region in region.toDictionary() }]
  }
}
