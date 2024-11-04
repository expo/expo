import MapKit

class AppleMapsGeoJsons: GeoJsons {
  private let mapView: MKMapView
  private var annotations: [MKAnnotation] = []
  private var overlays: [MKOverlay] = []

  init(mapView: MKMapView) {
    self.mapView = mapView
  }

  func setGeoJsons(geoJsonObjects: [GeoJsonObject]) {
    deleteGeoJsons()
    for geoJsonObject in geoJsonObjects {
      // swiftlint:disable:next force_cast force_try force_unwrapping
      let appleMapsObjects = try! MKGeoJSONDecoder().decode(geoJsonObject.geoJsonString.data(using: .utf8)!) as! [MKGeoJSONFeature]

      for object in appleMapsObjects {
        let geometry = object.geometry.first
        if let polygon = geometry as? MKPolygon {
          let expoPolygon = ExpoMKPolygon(points: polygon.points(), count: polygon.pointCount)
          applyPolygonDefaultStyle(polygon: expoPolygon, defaultStyle: geoJsonObject.defaultStyle)
          mapView.addOverlay(expoPolygon)
          overlays.append(expoPolygon)
        }
        if let polyline = geometry as? MKPolyline {
          let expoPolyline = ExpoMKPolyline(points: polyline.points(), count: polyline.pointCount)
          applyPolylineDefaultStyle(polyline: expoPolyline, defaultStyle: geoJsonObject.defaultStyle)
          mapView.addOverlay(expoPolyline)
          overlays.append(expoPolyline)
        }
        if let marker = geometry as? MKPointAnnotation {
          let expoMarker = ExpoMKColorAnnotation(
            coordinate: CLLocationCoordinate2D(
              latitude: marker.coordinate.latitude,
              longitude: marker.coordinate.longitude
            )
          )
          applyMarkerDefaultStyle(marker: expoMarker, defaultStyle: geoJsonObject.defaultStyle)
          mapView.addAnnotation(expoMarker)
          annotations.append(expoMarker)
        }
      }
    }
  }

  private func applyPolygonDefaultStyle(polygon: ExpoMKPolygon, defaultStyle: GeoJsonObjectDefaultStyle?) {
    if defaultStyle?.polygon?.strokeColor != nil {
      polygon.strokeColor = defaultStyle!.polygon!.strokeColor!
    }
    if defaultStyle?.polygon?.fillColor != nil {
      polygon.fillColor = defaultStyle!.polygon!.fillColor!
    }
    if defaultStyle?.polygon?.strokeWidth != nil {
      polygon.strokeWidth = defaultStyle!.polygon!.strokeWidth!
    }
    if defaultStyle?.polygon?.strokeJointType != nil {
      polygon.jointType = jointToCGLineJoin(defaultStyle!.polygon!.strokeJointType!)
    }
    if defaultStyle?.polygon?.strokeJointType != nil {
      polygon.strokePattern = strokePatternToLineDashPatternPolygon(pattern: defaultStyle!.polygon!.strokePattern!)
    }
  }

  private func applyPolylineDefaultStyle(polyline: ExpoMKPolyline, defaultStyle: GeoJsonObjectDefaultStyle?) {
    if defaultStyle?.polyline?.color != nil {
      polyline.color = defaultStyle!.polyline!.color!
    }
    if defaultStyle?.polyline?.width != nil {
      polyline.width = Float(defaultStyle!.polyline!.width!)
    }
    if defaultStyle?.polyline?.pattern != nil {
      polyline.pattern = strokePatternToLineDashPatternPolyline(pattern: defaultStyle!.polygon!.strokePattern!, dotLength: 0)
    }
  }

  private func applyMarkerDefaultStyle(marker: ExpoMKColorAnnotation, defaultStyle: GeoJsonObjectDefaultStyle?) {
    var hue: CGFloat = 0
    defaultStyle?.marker?.color?.getHue(&hue, saturation: nil, brightness: nil, alpha: nil)
    marker.title = defaultStyle?.marker?.title
    marker.subtitle = defaultStyle?.marker?.snippet
    marker.color = hue
  }

  func deleteGeoJsons() {
    mapView.removeAnnotations(annotations)
    mapView.removeOverlays(overlays)
  }
}
