import ExpoModulesCore

struct LatLngDeltaRecord: Record {
  init() {}

  @Field var latitudeDelta: Double = 0
  @Field var longitudeDelta: Double = 0
}
