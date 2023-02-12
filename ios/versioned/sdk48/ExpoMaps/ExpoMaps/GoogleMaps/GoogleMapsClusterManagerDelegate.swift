#if HAS_GOOGLE_UTILS
import GoogleMaps
import GoogleMapsUtils
import ABI48_0_0ExpoModulesCore

class GoogleMapsClusterManagerDelegate: NSObject, GMUClusterManagerDelegate {
  private var onClusterPress: Callback<[String: Any?]>?
  private let googleMapsMarkersManager: GoogleMapsMarkersManager

  init(googleMapsMarkersManager: GoogleMapsMarkersManager) {
    self.googleMapsMarkersManager = googleMapsMarkersManager
    super.init()
  }

  func clusterManager(_ clusterManager: GMUClusterManager, didTap cluster: GMUCluster) -> Bool {
    if let id = googleMapsMarkersManager.getClusterId(cluster: clusterManager) {
      onClusterPress?(ClusterRecord(id: id, cluster: cluster).toDictionary())
    }
    return false
  }

  func setOnClusterPress(onClusterPress: EventDispatcher) {
    self.onClusterPress = onClusterPress
  }
}
#endif
