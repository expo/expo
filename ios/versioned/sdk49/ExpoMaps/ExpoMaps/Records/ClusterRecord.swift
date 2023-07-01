#if HAS_GOOGLE_UTILS
import ABI49_0_0ExpoModulesCore
import GoogleMaps
import GoogleMapsUtils

struct ClusterRecord: Record {
  init() {}

  @Field var id: String?
  @Field var position: [String: Any?]

  init(id: String, cluster: GMUCluster) {
    self.id = id
    position = LatLngRecord(coordinate: cluster.position).toDictionary()
  }

  init(cluster: ExpoMKClusterAnnotation) {
    id = cluster.id
    position = LatLngRecord(coordinate: cluster.coordinate).toDictionary()
  }
}
#endif
