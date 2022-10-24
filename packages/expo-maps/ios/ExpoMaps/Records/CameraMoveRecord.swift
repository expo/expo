import ExpoModulesCore
import GoogleMaps
import MapKit

struct CameraMoveRecord: Record {
  init() {}

  @Field var target: [String: Any?]
  @Field var zoom: Float?
  @Field var bearing: Double?
  @Field var tilt: Double?
  @Field var latLngDelta: [String: Any?]?
  @Field var duration: Int = 1000
  @Field var animate: Bool = true
}
