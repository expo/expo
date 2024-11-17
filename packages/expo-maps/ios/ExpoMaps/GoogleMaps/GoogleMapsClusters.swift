import GoogleMaps
import GoogleMapsUtils

class GoogleMapsClusters: Clusters {
  private let mapView: GMSMapView
  private var clusterRenderersDelegates: [ExpoClusterRendererDelegate] = []
  private let googleMapsMarkersManager: GoogleMapsMarkersManager
  private let googleMapsClusterManagerDelegate: GoogleMapsClusterManagerDelegate
  private let googleMapsViewDelegate: GoogleMapsViewDelegate

  init(
    mapView: GMSMapView,
    googleMapsMarkersManager: GoogleMapsMarkersManager,
    googleMapsClusterManagerDelegate: GoogleMapsClusterManagerDelegate,
    googleMapsViewDelegate: GoogleMapsViewDelegate
  ) {
    self.mapView = mapView
    self.googleMapsMarkersManager = googleMapsMarkersManager
    self.googleMapsClusterManagerDelegate = googleMapsClusterManagerDelegate
    self.googleMapsViewDelegate = googleMapsViewDelegate
  }

  func setClusters(clusterObjects: [ClusterObject]) {
    googleMapsMarkersManager.clearClusters()
    clusterRenderersDelegates.removeAll()

    for clusterObject in clusterObjects {
      var hue: CGFloat = 0
      clusterObject.color?.getHue(&hue, saturation: nil, brightness: nil, alpha: nil)
      let color = clusterObject.color ?? UIColor(hue: hue, saturation: 1, brightness: 1, alpha: 1)
      // Cluster color has to be set in regard to number of clustered markers
      let iconGenerator = GMUDefaultClusterIconGenerator(
        buckets: [5, 10, 50, 100, 1000],
        backgroundColors: [
          color,
          color,
          color,
          color,
          color
        ]
      )
      let algorithm = GMUNonHierarchicalDistanceBasedAlgorithm()
      let renderer = ExpoClusterRenderer(minimumClusterSize: clusterObject.minimumClusterSize, mapView: mapView, clusterIconGenerator: iconGenerator)
      let rendererDelegate = ExpoClusterRendererDelegate(
        title: clusterObject.markerTitle,
        snippet: clusterObject.markerSnippet,
        icon: clusterObject.icon,
        color: hue,
        opacity: clusterObject.opacity
      )
      renderer.delegate = rendererDelegate
      let clusterManager = GMUClusterManager(map: mapView, algorithm: algorithm, renderer: renderer)

      for markerObject in clusterObject.markers {
        let clusterItem = createGoogleMarker(markerObject: markerObject, includeDragging: true)
        googleMapsMarkersManager.appendClusterItem(clusterItem: clusterItem, id: markerObject.id)
        clusterManager.add(clusterItem)
        clusterManager.cluster()
      }

      clusterManager.setDelegate(googleMapsClusterManagerDelegate, mapDelegate: googleMapsViewDelegate)
      googleMapsMarkersManager.appendCluster(cluster: clusterManager, id: clusterObject.id)
      clusterRenderersDelegates.append(rendererDelegate)
    }
  }
}

class ExpoClusterRendererDelegate: NSObject, GMUClusterRendererDelegate {
  private let title: String?
  private let snippet: String?
  private let icon: String?
  private let color: Double
  private let opacity: Double

  init(title: String?, snippet: String?, icon: String?, color: Double, opacity: Double) {
    self.title = title
    self.snippet = snippet
    self.icon = icon
    self.color = color
    self.opacity = opacity
  }

  func renderer(_ renderer: GMUClusterRenderer, willRenderMarker marker: GMSMarker) {
    if marker.userData is GMUCluster {
      let iconURL = (icon != nil) ? URL(fileURLWithPath: icon!) : nil
      marker.title = title
      marker.snippet = snippet
      marker.opacity = Float(opacity)

      if iconURL != nil {
        marker.icon = UIImage(contentsOfFile: iconURL!.standardized.path)
      }
    }
  }
}

class ExpoClusterRenderer: GMUDefaultClusterRenderer {
  init(minimumClusterSize: Int, mapView: GMSMapView, clusterIconGenerator: GMUClusterIconGenerator) {
    super.init(mapView: mapView, clusterIconGenerator: clusterIconGenerator)
    self.minimumClusterSize = UInt(minimumClusterSize)
  }
}
