import GoogleMaps
import GoogleMapsUtils
import CoreLocation

class GoogleMapsHeatmaps: Heatmaps {
  private let mapView: GMSMapView
  private var heatmaps: [GMUHeatmapTileLayer] = []

  init(mapView: GMSMapView) {
    self.mapView = mapView
  }

  func setHeatmaps(heatmapObjects: [HeatmapObject]) {
    detachAndDeleteHeatmaps()
    for heatmapObject in heatmapObjects {
      let heatmap: GMUHeatmapTileLayer = GMUHeatmapTileLayer()
      if let gradient = heatmapObject.gradient {
        heatmap.gradient = GMUGradient(
          colors: gradient.colors,
          startPoints: gradient.locations.map({ NSNumber(value: $0) }),
          colorMapSize: 256)
      }
      if let radius = heatmapObject.radius { heatmap.radius = radius }
      if let opacity = heatmapObject.opacity { heatmap.opacity = opacity }
      heatmap.weightedData = heatmapObject.points.map({
        GMUWeightedLatLng(
          coordinate: CLLocationCoordinate2D(latitude: $0.latitude, longitude: $0.longitude),
          intensity: $0.data ?? 1.0)
      })

      heatmap.map = mapView
      heatmaps.append(heatmap)
    }
  }

  internal func detachAndDeleteHeatmaps() {
    for heatmap in heatmaps {
      heatmap.map = nil
    }
    heatmaps = []
  }
}
