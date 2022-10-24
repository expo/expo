class AppleMapsMarkersManager {
  
  private var markersMap: [ExpoMKAnnotation : String?] = [:]
  private var clustersItemsMap: [ExpoMKAnnotation : String?] = [:]
    
  func appendMarker(marker: ExpoMKAnnotation) {
    markersMap[marker] = marker.id
  }
  
  func clearMarkers() {
    markersMap.removeAll()
  }
  
  func getMarkerId(marker: ExpoMKAnnotation) -> String? {
    return markersMap[marker] ?? nil
  }
  
  func getMarkers() -> [ExpoMKAnnotation] {
    return Array(markersMap.keys)
  }
  
  func appendClustersItem(clusterItem: ExpoMKAnnotation) {
    clustersItemsMap[clusterItem] = clusterItem.id
  }
  
  func clearClustersItems() {
    clustersItemsMap.removeAll()
  }
  
  func getClusterItemId(clusterItem: ExpoMKAnnotation) -> String? {
    return clustersItemsMap[clusterItem] ?? nil
  }
  
  func getClustersItems() -> [ExpoMKAnnotation] {
    return Array(clustersItemsMap.keys)
  }
}
