import MapKit

class AppleMapsClusters: Clusters {
  private let mapView: MKMapView
  private let markersManager: AppleMapsMarkersManager

  /*
   Two custer classes, which are used to display clusters on a map, are here registered in order to reuse their instances
   when user scrolls a map.
   */
  init(mapView: MKMapView, markersManager: AppleMapsMarkersManager) {
    self.mapView = mapView
    self.markersManager = markersManager
    mapView.register(ExpoMKClusterImageAnnotationView.self, forAnnotationViewWithReuseIdentifier: "image_cluster")
    mapView.register(ExpoMKClusterColorAnnotationView.self, forAnnotationViewWithReuseIdentifier: "color_cluster")
  }

  func setClusters(clusterObjects: [ClusterObject]) {
    mapView.removeAnnotations(markersManager.getClustersItems())

    for clusterObject in clusterObjects {
      for markerObject in clusterObject.markers {
        let marker = createAppleMarker(markerObject: markerObject, includeDragging: true)

        if clusterObject.markers.count >= clusterObject.minimumClusterSize {
          marker.clusterName = clusterObject.name
        }

        mapView.addAnnotation(marker)
        markersManager.appendClustersItem(clusterItem: marker)
      }
    }
  }
}
