import ABI48_0_0ExpoModulesCore
import GoogleMaps
import MapKit

struct LatLngDelta: Record {
  @Field var latitudeDelta: Double
  @Field var longitudeDelta: Double
}

struct CameraMoveRecord: Record {
  init() {}

  @Field var target: [String: Any?]
  @Field var zoom: Float?
  @Field var bearing: Double?
  @Field var tilt: Double?
  @Field var latLngDelta: LatLngDelta?
  @Field var duration: Int = 1000
  @Field var animate: Bool = true
}
