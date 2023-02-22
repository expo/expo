class AppleMapsMarkersManager {
  private var markersMap: [ExpoMKAnnotation: String] = [:]
  private var clustersItemsMap: [ExpoMKAnnotation: String] = [:]

  func appendMarker(marker: ExpoMKAnnotation) {
    guard let markerId = marker.id else {
      return
    }
    markersMap[marker] = markerId
  }

  func clearMarkers() {
    markersMap.removeAll()
  }

  func getMarkerId(marker: ExpoMKAnnotation) -> String? {
    return markersMap[marker]
  }

  func getMarkers() -> [ExpoMKAnnotation] {
    return Array(markersMap.keys)
  }

  func appendClustersItem(clusterItem: ExpoMKAnnotation) {
    guard let clusterId = clusterItem.id else {
      return
    }
    clustersItemsMap[clusterItem] = clusterId
  }

  func clearClustersItems() {
    clustersItemsMap.removeAll()
  }

  func getClusterItemId(clusterItem: ExpoMKAnnotation) -> String? {
    return clustersItemsMap[clusterItem]
  }

  func getClustersItems() -> [ExpoMKAnnotation] {
    return Array(clustersItemsMap.keys)
  }
}
