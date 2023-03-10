import GoogleMaps

class GoogleMapsPolylines: Polylines {
  private let mapView: GMSMapView
  private var polylines: [ExpoGoogleMapsPolyline] = []

  init(mapView: GMSMapView) {
    self.mapView = mapView
  }

  func setPolylines(polylineObjects: [PolylineObject]) {
    detachAndDeletePolylines()
    for polylineObject in polylineObjects {
      let path = GMSMutablePath()
      for point in polylineObject.points {
        path.add(CLLocationCoordinate2D(latitude: point.latitude, longitude: point.longitude))
      }
      let polyline = ExpoGoogleMapsPolyline(path: path)
      polyline.strokeWidth = CGFloat(polylineObject.width ?? Float(polyline.strokeWidth))
      polyline.strokeColor = polylineObject.color ?? polyline.strokeColor
      if polylineObject.pattern != nil {
        polyline.pattern = polylineObject.pattern
        polyline.spans = strokePatternToStyles(
          path: polyline.path!, strokePattern: polyline.pattern!, color: polyline.strokeColor,
          width: Float(polyline.strokeWidth))
      }
      polyline.map = mapView
      polylines.append(polyline)
    }
  }

  internal func detachAndDeletePolylines() {
    for polyline in polylines {
      polyline.map = nil
    }
    polylines = []
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
    for polyline in polylines where polyline.pattern != nil {
      polyline.spans = strokePatternToStyles(
        path: polyline.path!, strokePattern: polyline.pattern!, color: polyline.strokeColor,
        width: Float(polyline.strokeWidth))
    }
  }
}
