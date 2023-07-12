import MapKit

class AppleMapsPolygons: Polygons {
  private let mapView: MKMapView
  private var polygons: [MKPolygon] = []
  private var kmlPolygons: [MKPolygon] = []

  init(mapView: MKMapView) {
    self.mapView = mapView
  }

  func setPolygons(polygonObjects: [PolygonObject]) {
    detachAndDeletePolygons()
    for polygonObject in polygonObjects {
      let polygon = createPolygon(polygonObject: polygonObject)
      mapView.addOverlay(polygon)
      polygons.append(polygon)
    }
  }

  func setKMLPolygons(polygonObjects: [PolygonObject]) {
    detachAndDeleteKMLPolygons()
    for polygonObject in polygonObjects {
      let polygon = createPolygon(polygonObject: polygonObject)
      mapView.addOverlay(polygon)
      kmlPolygons.append(polygon)
    }
  }

  internal func detachAndDeletePolygons() {
    mapView.removeOverlays(polygons)
    polygons = []
  }

  private func detachAndDeleteKMLPolygons() {
    mapView.removeOverlays(kmlPolygons)
    kmlPolygons = []
  }

  private func createPolygon(polygonObject: PolygonObject) -> MKPolygon {
    var overlayPoints: [CLLocationCoordinate2D] = []
    for point in polygonObject.points {
      overlayPoints.append(
        CLLocationCoordinate2D(latitude: point.latitude, longitude: point.longitude))
    }
    let polygon = ExpoMKPolygon(coordinates: &overlayPoints, count: overlayPoints.count)
    if polygonObject.fillColor != nil { polygon.fillColor = polygonObject.fillColor! }
    if polygonObject.strokeColor != nil { polygon.strokeColor = polygonObject.strokeColor! }
    if polygonObject.strokeWidth != nil { polygon.strokeWidth = polygonObject.strokeWidth! }
    if polygonObject.strokePattern != nil {
      polygon.strokePattern = strokePatternToLineDashPatternPolygon(
        pattern: polygonObject.strokePattern, width: polygon.strokeWidth)
      if polygonObject.strokeWidth == nil { polygon.strokeWidth = 1.0 }
    }
    polygon.jointType = jointToCGLineJoin(polygonObject.jointType)

    return polygon
  }
}
