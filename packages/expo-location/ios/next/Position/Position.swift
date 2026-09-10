import ExpoModulesCore
import CoreLocation

@Record
struct Coordinates {
  var latitude: Double
  var longitude: Double
  init(latitude: Double, longitude: Double) {
    self.latitude = latitude
    self.longitude = longitude
  }
}

@Record
struct Position {
  var coordinates: Coordinates
  var horizontalAccuracy: Double?
  var timestamp: Double
  var altitude: Double?
  var mslAltitude: Double?
  var verticalAccuracy: Double?
  var mocked: Bool
  var heading: Double?
  var headingAccuracy: Double?
  var speed: Double?
  var speedAccuracy: Double?
  init(
    coordinates: Coordinates,
    horizontalAccuracy: Double?,
    timestamp: Double,
    altitude: Double?,
    mslAltitude: Double?,
    verticalAccuracy: Double?,
    mocked: Bool,
    heading: Double?,
    headingAccuracy: Double?,
    speed: Double?,
    speedAccuracy: Double?
  ) {
    self.coordinates = coordinates
    self.horizontalAccuracy = horizontalAccuracy
    self.timestamp = timestamp
    self.altitude = altitude
    self.mslAltitude = mslAltitude
    self.verticalAccuracy = verticalAccuracy
    self.mocked = mocked
    self.heading = heading
    self.headingAccuracy = headingAccuracy
    self.speed = speed
    self.speedAccuracy = speedAccuracy
  }
}

extension Position {
  func toEventPayload() -> [String: Any] {
    var payload = toDictionary()
    payload["coordinates"] = coordinates.toDictionary()
    return payload
  }
}

extension CLLocation {
  func toPosition() -> Position {
    return Position(
      coordinates: Coordinates(latitude: coordinate.latitude, longitude: coordinate.longitude),
      horizontalAccuracy: horizontalAccuracy >= 0 ? horizontalAccuracy : nil,
      timestamp: timestamp.timeIntervalSince1970 * 1000,
      altitude: verticalAccuracy > 0 ? ellipsoidalAltitude : nil,
      mslAltitude: verticalAccuracy > 0 ? altitude : nil,
      verticalAccuracy: verticalAccuracy > 0 ? verticalAccuracy : nil,
      mocked: sourceInformation?.isSimulatedBySoftware ?? false,
      heading: course >= 0 ? course : nil,
      headingAccuracy: course >= 0 && courseAccuracy >= 0 ? courseAccuracy : nil,
      speed: speed >= 0 ? speed : nil,
      speedAccuracy: speed >= 0 && speedAccuracy >= 0 ? speedAccuracy : nil
    )
  }
}
