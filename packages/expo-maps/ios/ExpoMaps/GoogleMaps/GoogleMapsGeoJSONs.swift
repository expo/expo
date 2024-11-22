import GoogleMaps
import GoogleMapsUtils

class GoogleMapsGeoJsons: GeoJsons {
  private let mapView: GMSMapView
  private var renderers: [GMUGeometryRenderer] = []

  init(mapView: GMSMapView) {
    self.mapView = mapView
  }

  func setGeoJsons(geoJsonObjects: [GeoJsonObject]) {
    deleteGeoJsons()
    for geoJsonObject in geoJsonObjects {
      let geoJsonParser = GMUGeoJSONParser(data: geoJsonObject.geoJsonString.data(using: .utf8)!)
      geoJsonParser.parse()

      for feature in geoJsonParser.features {
        if feature.geometry.type == "Polygon" {
          feature.style = GMUStyle(
            styleID: "defaultExpoMapsStyle",
            stroke: geoJsonObject.defaultStyle?.polygon?.strokeColor,
            fill: geoJsonObject.defaultStyle?.polygon?.fillColor,
            width: geoJsonObject.defaultStyle?.polygon?.strokeWidth != nil ? CGFloat(geoJsonObject.defaultStyle!.polygon!.strokeWidth!) : CGFloat(),
            scale: CGFloat(),
            heading: CGFloat(),
            anchor: CGPoint(),
            iconUrl: nil,
            title: nil,
            hasFill: geoJsonObject.defaultStyle?.polygon?.fillColor != nil,
            hasStroke: geoJsonObject.defaultStyle?.polygon?.strokeColor != nil
          )
        } else if feature.geometry.type == "LineString" {
          feature.style = GMUStyle(
            styleID: "defaultExpoMapsStyle",
            stroke: geoJsonObject.defaultStyle?.polyline?.color,
            fill: nil,
            width: geoJsonObject.defaultStyle?.polyline?.width != nil ? CGFloat(geoJsonObject.defaultStyle!.polyline!.width!) : CGFloat(),
            scale: CGFloat(),
            heading: CGFloat(),
            anchor: CGPoint(),
            iconUrl: nil,
            title: nil,
            hasFill: false,
            hasStroke: geoJsonObject.defaultStyle?.polyline?.color != nil
          )
        }
      }

      let renderer = GMUGeometryRenderer(
        map: mapView,
        geometries: geoJsonParser.features
      )

      renderer.render()
      renderers.append(renderer)
    }
  }

  private func deleteGeoJsons() {
    for renderer in renderers {
      renderer.clear()
    }
    renderers = []
  }
}
