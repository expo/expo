import GoogleMaps

#if HAS_GOOGLE_UTILS
import GoogleMapsUtils
#endif

class GoogleMapsMarkersManager {
  private var markersMap: [GMSMarker: String] = [:]
#if HAS_GOOGLE_UTILS
  private var clustersMap: [GMUClusterManager: String] = [:]
#endif

  private var clustersItemsMap: [GMSMarker: String] = [:]

  func clearMarkers() {
    for marker in markersMap.keys {
      marker.map = nil
    }
    markersMap.removeAll()
  }

  func appendMarker(marker: GMSMarker, id: String?) {
    guard let id = id else {
      markersMap.removeValue(forKey: marker)
      return
    }
    markersMap[marker] = id
  }

  func getMarkerId(marker: GMSMarker) -> String? {
    return markersMap[marker]
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
    guard let id = id else {
      clustersMap.removeValue(forKey: cluster)
      return
    }
    clustersMap[cluster] = id
  }

  func appendClusterItem(clusterItem: GMSMarker, id: String?) {
    guard let id = id else {
      clustersItemsMap.removeValue(forKey: clusterItem)
      return
    }
    clustersItemsMap[clusterItem] = id
  }

  func getClusterId(cluster: GMUClusterManager) -> String? {
    return clustersMap[cluster]
  }

  func getClusterItemId(clusterItem: GMSMarker) -> String? {
    return clustersItemsMap[clusterItem]
  }
#endif
}
