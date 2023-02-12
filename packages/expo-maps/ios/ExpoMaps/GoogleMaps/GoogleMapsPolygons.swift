import GoogleMaps

class GoogleMapsPolygons: Polygons {
  private let mapView: GMSMapView
  private var polygons: [GMSPolygon] = []
  private var edges: [ExpoGoogleMapsPolyline] = []

  init(mapView: GMSMapView) {
    self.mapView = mapView
  }

  func setPolygons(polygonObjects: [PolygonObject]) {
    detachAndDeletePolygons()
    for polygonObject in polygonObjects {
      let path = GMSMutablePath()
      for point in polygonObject.points {
        path.add(CLLocationCoordinate2D(latitude: point.latitude, longitude: point.longitude))
      }
      let polygon = GMSPolygon(path: path)
      polygon.fillColor = polygonObject.fillColor ?? polygon.fillColor
      if polygonObject.strokePattern == nil {
        polygon.strokeWidth = CGFloat(polygonObject.strokeWidth ?? Float(polygon.strokeWidth))
        polygon.strokeColor = polygonObject.strokeColor ?? polygon.strokeColor
      } else {
        polygon.strokeWidth = 0
        polygon.strokeColor = UIColor.clear

        let edge = ExpoGoogleMapsPolyline()
        edge.strokeWidth = CGFloat(polygonObject.strokeWidth ?? Float(edge.strokeWidth))
        edge.strokeColor = polygonObject.strokeColor ?? edge.strokeColor
        if !polygonObject.points.isEmpty {
          let point = polygonObject.points[0]
          path.add(CLLocationCoordinate2D(latitude: point.latitude, longitude: point.longitude))
        }
        edge.path = path
        edge.pattern = polygonObject.strokePattern
        edge.spans = strokePatternToStyles(
          path: path, strokePattern: edge.pattern!, color: edge.strokeColor,
          width: Float(edge.strokeWidth))
        edge.map = mapView
        edges.append(edge)
      }
      polygon.map = mapView
      polygons.append(polygon)
    }
  }

  internal func detachAndDeletePolygons() {
    for polygon in polygons {
      polygon.map = nil
    }
    polygons = []
    for edge in edges {
      edge.map = nil
    }
    edges = []
  }

  private func strokePatternToStyles(
    path: GMSPath, strokePattern: [PatternItem], color: UIColor = .blue, width: Float = 2
  ) -> [GMSStyleSpan] {
    let col = GMSStrokeStyle.solidColor(color)
    let trans = GMSStrokeStyle.solidColor(.clear)
    let styles = strokePattern.map({ (patIt: PatternItem) -> GMSStrokeStyle in
      switch patIt.type {
      case .stroke:
        return col
      case .gap:
        return trans
      }
    })
    let scale: Float = Float(
      1.0 / mapView.projection.points(forMeters: 1, at: mapView.camera.target))
    let lengths = strokePattern.map({
      $0.length == 0 && $0.type == .stroke
        ? NSNumber(value: scale * width) : NSNumber(value: scale * $0.length)
    })
    return GMSStyleSpans(path, styles, lengths, GMSLengthKind.rhumb)
  }

  func updateStrokePatterns() {
    for polyline in edges where polyline.pattern != nil {
      polyline.spans = strokePatternToStyles(
        path: polyline.path!, strokePattern: polyline.pattern!, color: polyline.strokeColor,
        width: Float(polyline.strokeWidth))
    }
  }
}
