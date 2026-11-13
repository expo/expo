import CoreLocation
import ExpoModulesCore

struct GeofencingRegion: Record {
  @Field var identifier: String
  @Field var latitude: Double
  @Field var longitude: Double
  @Field var radius: Double

  var center: CLLocationCoordinate2D {
    CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
  }

  var isValid: Bool {
    !identifier.isEmpty && CLLocationCoordinate2DIsValid(center) && radius > 0 && radius.isFinite
  }

  @available(iOS 17, *)
  func toCondition() -> CLMonitor.CircularGeographicCondition {
    CLMonitor.CircularGeographicCondition(center: center, radius: radius)
  }

  func toCircularRegion(identifier: String) -> CLCircularRegion {
    CLCircularRegion(center: center, radius: radius, identifier: identifier)
  }
}
