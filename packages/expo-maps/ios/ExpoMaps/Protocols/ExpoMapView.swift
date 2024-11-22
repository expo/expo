import ExpoModulesCore

protocol ExpoMapView: UIView {

  func setMapType(mapType: MapType)
  func setMarkers(markerObjects: [MarkerObject])
  func setPolygons(polygonObjects: [PolygonObject])
  func setPolylines(polylineObjects: [PolylineObject])
  func setInitialCameraPosition(initialCameraPosition: CameraMoveRecord)
  func moveCamera(cameraMove: CameraMoveRecord, promise: Promise?)
  func setEnabledTraffic(enableTraffic: Bool)
  func setKMLs(kmlObjects: [KMLObject])
  func setGeoJsons(geoJsonObjects: [GeoJsonObject])
  func setOverlays(overlayObjects: [OverlayObject])
}
