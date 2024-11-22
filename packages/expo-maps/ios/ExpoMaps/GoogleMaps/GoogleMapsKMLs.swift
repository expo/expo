import GoogleMaps
import GoogleMapsUtils

class GoogleMapsKMLs: KMLs {
  private let mapView: GMSMapView
  private var renderers: [GMUGeometryRenderer] = []

  init(mapView: GMSMapView) {
    self.mapView = mapView
  }

  func setKMLs(kmlObjects: [KMLObject]) {
    deleteKMLs()

    for kmlObject in kmlObjects {
      let url = URL(fileURLWithPath: kmlObject.filePath)
      let kmlParser = GMUKMLParser(url: url.standardized)
      kmlParser.parse()

      let renderer = GMUGeometryRenderer(
        map: mapView,
        geometries: kmlParser.placemarks,
        styles: kmlParser.styles
      )

      renderer.render()
      renderers.append(renderer)
    }
  }

  private func deleteKMLs() {
    for renderer in renderers {
      renderer.clear()
    }
    renderers = []
  }
}
