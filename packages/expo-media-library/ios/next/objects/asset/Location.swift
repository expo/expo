import ExpoModulesCore

struct Location: Record {
  @Field var latitude: Double
  @Field var longitude: Double

  init() {}

  init(latitude: Double, longitude: Double) {
    self.latitude = latitude
    self.longitude = longitude
  }
}
