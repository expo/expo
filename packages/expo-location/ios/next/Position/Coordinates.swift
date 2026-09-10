import ExpoModulesCore

@Record
struct Coordinates {
  var latitude: Double
  var longitude: Double
  init(latitude: Double, longitude: Double) {
    self.latitude = latitude
    self.longitude = longitude
  }
}
