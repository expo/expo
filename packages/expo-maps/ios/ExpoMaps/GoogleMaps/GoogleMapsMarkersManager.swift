import GoogleMaps

#if HAS_GOOGLE_UTILS
import GoogleMapsUtils
#endif

class GoogleMapsMarkersManager {
  
  private var markersMap: [GMSMarker : String?] = [:]
#if HAS_GOOGLE_UTILS
  private var clustersMap: [GMUClusterManager : String?] = [:]
#endif

  private var clustersItemsMap: [GMSMarker : String?] = [:]
  
  func clearMarkers() {
    for marker in markersMap.keys {
      marker.map = nil
    }
    markersMap.removeAll()
  }
  
  func appendMarker(marker: GMSMarker, id: String?) {
    markersMap[marker] = id
  }
  
  func getMarkerId(marker: GMSMarker) -> String? {
    return markersMap[marker] ?? nil
  }

#if HAS_GOOGLE_UTILS
  func clearClusters() {
    for clusterItem in clustersItemsMap.keys {
      clusterItem.map = nil
    }
    clustersItemsMap.removeAll()
    
    for cluster in clustersMap.keys {
      cluster.clearItems()
      cluster.cluster()
    }
    clustersMap.removeAll()
  }
  
  func appendCluster(cluster: GMUClusterManager, id: String?) {
    clustersMap[cluster] = id
  }
  
  func appendClusterItem(clusterItem: GMSMarker, id: String?) {
    clustersItemsMap[clusterItem] = id
  }
  
  func getClusterId(cluster: GMUClusterManager) -> String? {
    return clustersMap[cluster] ?? nil
  }
  
  func getClusterItemId(clusterItem: GMSMarker) -> String? {
    return clustersItemsMap[clusterItem] ?? nil
  }
#endif
}
