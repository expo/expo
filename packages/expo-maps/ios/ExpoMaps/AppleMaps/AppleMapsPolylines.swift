import MapKit

class AppleMapsPolylines: Polylines {
  private let mapView: MKMapView
  private var polylines: [MKPolyline] = []
  private var kmlPolylines: [MKPolyline] = []

  init(mapView: MKMapView) {
    self.mapView = mapView
  }

  func setPolylines(polylineObjects: [PolylineObject]) {
    detachAndDeletePolylines()
    for polylineObject in polylineObjects {
      let polyline = createPolyline(polylineObject: polylineObject)
      mapView.addOverlay(polyline)
      polylines.append(polyline)
    }
  }

  func setKMLPolylines(polylineObjects: [PolylineObject]) {
    detachAndDeleteKMLPolylines()
    for polylineObject in polylineObjects {
      let polyline = createPolyline(polylineObject: polylineObject)
      mapView.addOverlay(polyline)
      kmlPolylines.append(polyline)
    }
  }

  internal func detachAndDeletePolylines() {
    mapView.removeOverlays(polylines)
    polylines = []
  }

  private func detachAndDeleteKMLPolylines() {
    mapView.removeOverlays(kmlPolylines)
    kmlPolylines = []
  }

  private func createPolyline(polylineObject: PolylineObject) -> MKPolyline {
    var overlayPoints: [CLLocationCoordinate2D] = []
    for point in polylineObject.points {
      overlayPoints.append(
        CLLocationCoordinate2D(latitude: point.latitude, longitude: point.longitude))
    }
    let polyline = ExpoMKPolyline(coordinates: &overlayPoints, count: overlayPoints.count)
    if polylineObject.color != nil { polyline.color = polylineObject.color! }
    if polylineObject.width != nil { polyline.width = polylineObject.width! }
    let dotLength = polylineObject.capType == .butt ? polyline.width : 0
    polyline.pattern = strokePatternToLineDashPatternPolyline(
      pattern: polylineObject.pattern, dotLength: dotLength)
    polyline.jointType = jointToCGLineJoin(polylineObject.jointType)
    polyline.capType = capToCGLineCap(polylineObject.capType)

    return polyline
  }

  private func capToCGLineCap(_ capType: Cap?) -> CGLineCap {
    switch capType {
    case .round:
      return .round
    case .butt:
      return .butt
    case .square:
      return .square
    default:
      return .round
    }
  }
}
