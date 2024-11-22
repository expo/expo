import GoogleMaps
import ExpoModulesCore

class GoogleMapsViewDelegate: NSObject, GMSMapViewDelegate {
  public var expoMapView: GoogleMapsView?
  private var zoom: Float = 0.0
  public let infoMarker = GMSMarker()
  private let googleMapsMarkersManager: GoogleMapsMarkersManager
  private var mapInitialized: Bool = false
  private var mapInitialLoadComplete: Bool = false

  init(googleMapsMarkersManager: GoogleMapsMarkersManager) {
    self.googleMapsMarkersManager = googleMapsMarkersManager
    infoMarker.opacity = 0
    super.init()
  }

  func mapView(_ mapView: GMSMapView, didTapAt coordinate: CLLocationCoordinate2D) {
    expoMapView?.onMapPress(LatLngRecord(coordinate: coordinate).toDictionary())
  }

  func mapView(_ mapView: GMSMapView, didLongPressAt coordinate: CLLocationCoordinate2D) {
    expoMapView?.onLongPress(LatLngRecord(coordinate: coordinate).toDictionary())
  }

  func mapViewDidFinishTileRendering(_ mapView: GMSMapView) {
    if !mapInitialLoadComplete {
      // TODO: pass null instead of empty dict
      expoMapView?.onMapLoaded([:])
      mapInitialLoadComplete = true
    }
  }

  func mapView(_ mapView: GMSMapView, willMove: Bool) {
    expoMapView?.onRegionChangeStarted(CameraPositionRecord(
      cameraPosition: mapView.camera,
      visibleRegion: mapView.projection.visibleRegion()).toDictionary())
  }

  func mapView(_ mapView: GMSMapView, didChange position: GMSCameraPosition) {
    if expoMapView == nil {
      return
    }
    if zoom != position.zoom {
      expoMapView!.updatePolylines()
      expoMapView!.updatePolygons()
    }
    expoMapView?.onRegionChange(CameraPositionRecord(
      cameraPosition: mapView.camera,
      visibleRegion: mapView.projection.visibleRegion()).toDictionary())
  }

  func mapView(_ mapView: GMSMapView, idleAt position: GMSCameraPosition) {
    expoMapView?.onRegionChangeComplete(CameraPositionRecord(
      cameraPosition: mapView.camera,
      visibleRegion: mapView.projection.visibleRegion()).toDictionary())
  }

  func mapView(_ mapView: GMSMapView, didTap marker: GMSMarker) -> Bool {
    if let id = googleMapsMarkersManager.getMarkerId(marker: marker) {
      expoMapView?.onMarkerPress(MarkerRecord(id: id, marker: marker).toDictionary())
    }
    if let id = googleMapsMarkersManager.getClusterItemId(clusterItem: marker) {
      expoMapView?.onMarkerPress(MarkerRecord(id: id, marker: marker).toDictionary())
    }
    return false
  }

  func mapView(_ mapView: GMSMapView, didDrag marker: GMSMarker) {
    let id = googleMapsMarkersManager.getMarkerId(marker: marker)
    expoMapView?.onMarkerDrag(MarkerRecord(id: id, marker: marker).toDictionary())
  }

  func mapView(_ mapView: GMSMapView, didBeginDragging marker: GMSMarker) {
    let id = googleMapsMarkersManager.getMarkerId(marker: marker)
    expoMapView?.onMarkerDragStarted(MarkerRecord(id: id, marker: marker).toDictionary())
  }

  func mapView(_ mapView: GMSMapView, didEndDragging marker: GMSMarker) {
    let id = googleMapsMarkersManager.getMarkerId(marker: marker)
    expoMapView?.onMarkerDragComplete(MarkerRecord(id: id, marker: marker).toDictionary())
  }

  func mapView(_ mapView: GMSMapView, didTapMyLocation location: CLLocationCoordinate2D) {
    if let myLocation = mapView.myLocation {
      expoMapView?.onLocationDotPress(UserLocationRecord(location: myLocation).toDictionary())
    }
  }

  func didTapMyLocationButton(for mapView: GMSMapView) -> Bool {
    if let myLocation = mapView.myLocation {
      expoMapView?.onLocationButtonPress(UserLocationRecord(location: myLocation).toDictionary())
    }
    return false
  }

  func mapView(
    _ mapView: GMSMapView,
    didTapPOIWithPlaceID placeId: String,
    name: String,
    location: CLLocationCoordinate2D
  ) {
    if expoMapView!.clickablePOIs {
      infoMarker.position = location
      infoMarker.title = name
      infoMarker.map = mapView
      mapView.selectedMarker = infoMarker
    }
    expoMapView?.onPoiClick(PointOfInterestRecord(placeId: placeId, name: name, location: location).toDictionary())
  }

  // swiftlint:disable block_based_kvo
  override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey: Any]?, context: UnsafeMutableRawPointer?) {
    if keyPath == "myLocation" {
      if let mapView = object as? GMSMapView {
        expoMapView?.onLocationChange(UserLocationRecord(location: mapView.myLocation!).toDictionary())
      }
    } else {
      super.observeValue(forKeyPath: keyPath, of: object, change: change, context: context)
    }
  }
}
