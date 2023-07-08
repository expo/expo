import ABI49_0_0ExpoModulesCore
import MapKit

struct UserLocationRecord: Record {
  init() {}

  @Field var position: [String: Any?]
  @Field var altitude: Double?
  @Field var accuracy: Double?
  @Field var verticalAccuracy: Double?
  @Field var speed: Double?
  @Field var speedAccuracy: Double?
  @Field var heading: Double?
  @Field var timestamp: Double?

  init(location: CLLocation) {
    position = LatLngRecord(coordinate: location.coordinate).toDictionary()
    altitude = location.altitude
    accuracy = location.horizontalAccuracy
    verticalAccuracy = location.verticalAccuracy
    speed = location.speed
    speedAccuracy = location.speedAccuracy
    heading = location.course
    timestamp = location.timestamp.timeIntervalSinceReferenceDate * 1000
  }

  init(location: MKUserLocation) {
    position = LatLngRecord(coordinate: location.coordinate).toDictionary()
    altitude = location.location?.altitude
    accuracy = location.location?.horizontalAccuracy
    verticalAccuracy = location.location?.verticalAccuracy
    speed = location.location?.speed
    speedAccuracy = location.location?.speedAccuracy
    heading = location.heading?.trueHeading
    timestamp = (location.location?.timestamp.timeIntervalSinceReferenceDate ?? -1) * 1000
  }
}
