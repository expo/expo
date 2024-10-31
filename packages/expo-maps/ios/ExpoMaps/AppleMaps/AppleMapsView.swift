import MapKit
import ExpoModulesCore
import UIKit

public final class AppleMapsView: UIView, ExpoMapView, UIGestureRecognizerDelegate {
  private let mapView: MKMapView
  private let controls: AppleMapsControls
  private var delegate: AppleMapsDelegate?
  private let markers: AppleMapsMarkers
  private let clusters: AppleMapsClusters
  private let gestures: AppleMapsGestures
  private let polygons: AppleMapsPolygons
  private let polylines: AppleMapsPolylines
  private let circles: AppleMapsCircles
  private let geoJsons: AppleMapsGeoJsons
  private let kmls: AppleMapsKMLs
  private let pointsOfInterest: AppleMapsPOI
  private let markersManager: AppleMapsMarkersManager = AppleMapsMarkersManager()
  private let cameraAnimator: AppleMapsCameraAnimations
  private var wasInitialCameraPositionSet = false

  var onMapLoaded = EventDispatcher()
  var onMapPress = EventDispatcher()
  var onDoublePress = EventDispatcher()
  var onLongPress = EventDispatcher()
  var onRegionChange = EventDispatcher()
  var onRegionChangeStarted = EventDispatcher()
  var onRegionChangeComplete = EventDispatcher()
  var onMarkerPress = EventDispatcher()
  var onMarkerDrag = EventDispatcher()
  var onMarkerDragStarted = EventDispatcher()
  var onMarkerDragComplete = EventDispatcher()
  var onClusterPress = EventDispatcher()
  var onLocationButtonPress = EventDispatcher()
  var onLocationDotPress = EventDispatcher()
  var onLocationChange = EventDispatcher()

  init(sendEvent: @escaping (String, [String: Any?]) -> Void) {
    mapView = MKMapView()
    mapView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    controls = AppleMapsControls(mapView: mapView)
    markers = AppleMapsMarkers(mapView: mapView, markersManager: markersManager)
    clusters = AppleMapsClusters(mapView: mapView, markersManager: markersManager)
    gestures = AppleMapsGestures(mapView: mapView)
    polygons = AppleMapsPolygons(mapView: mapView)
    polylines = AppleMapsPolylines(mapView: mapView)
    circles = AppleMapsCircles(mapView: mapView)
    geoJsons = AppleMapsGeoJsons(mapView: mapView)
    kmls = AppleMapsKMLs(mapView: mapView, markers: markers, polylines: polylines, polygons: polygons)
    pointsOfInterest = AppleMapsPOI(mapView: mapView, markers: markers)
    cameraAnimator = AppleMapsCameraAnimations(mapView: mapView)
    super.init(frame: CGRect.zero)
    delegate = AppleMapsDelegate(sendEvent: sendEvent, markersManager: markersManager, appleMapsView: self)
    mapView.delegate = delegate

    let singleTap = UITapGestureRecognizer(target: self, action: #selector(handleTap(_:)))
    singleTap.numberOfTapsRequired = 1
    mapView.addGestureRecognizer(singleTap)

    let doubleTap = UITapGestureRecognizer(target: self, action: #selector(handleDoubleTap(_:)))
    doubleTap.numberOfTapsRequired = 2
    doubleTap.delegate = self
    mapView.addGestureRecognizer(doubleTap)
    singleTap.require(toFail: doubleTap)

    let longPress = UILongPressGestureRecognizer(target: self, action: #selector(handleLongPress(_:)))
    mapView.addGestureRecognizer(longPress)
    singleTap.require(toFail: longPress)

    addSubview(mapView)
  }

  func moveCamera(cameraMove: CameraMoveRecord, promise: Promise?) {
    cameraAnimator.moveCamera(cameraMove: cameraMove, promise: promise)
  }

  // Allows the double tap to work

  public func gestureRecognizer(
    _ gestureRecognizer: UIGestureRecognizer,
    _ otherGestureRecognizer: UIGestureRecognizer
  ) -> Bool {
    true
  }

  @objc func handleTap(_ sender: UITapGestureRecognizer) {
    if sender.state == .ended {
      let pressCoordinates = mapView.convert(sender.location(in: mapView), toCoordinateFrom: mapView)
      onMapPress(LatLngRecord(coordinate: pressCoordinates).toDictionary())
    }
  }

  @objc func handleDoubleTap(_ sender: UITapGestureRecognizer) {
    if sender.state == .ended {
      let pressCoordinates = mapView.convert(sender.location(in: mapView), toCoordinateFrom: mapView)
      onDoublePress(LatLngRecord(coordinate: pressCoordinates).toDictionary())
    }
  }

  @objc func handleLongPress(_ sender: UILongPressGestureRecognizer) {
    if sender.state == .ended {
      let pressCoordinates = mapView.convert(sender.location(in: mapView), toCoordinateFrom: mapView)
      onLongPress(LatLngRecord(coordinate: pressCoordinates).toDictionary())
    }
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  func setShowCompass(enable: Bool) {
    controls.setShowCompass(enable: enable)
  }

  func setShowMyLocationButton(enable: Bool) {
    controls.setShowMyLocationButton(enable: enable)
  }

  func setShowLevelPicker(enable: Bool) {
    controls.setShowLevelPicker(enable: enable)
  }

  func setEnabledRotateGestures(enabled: Bool) {
    gestures.setEnabledRotateGesture(enabled: enabled)
  }

  func setEnabledScrollGestures(enabled: Bool) {
    gestures.setEnabledScrollGesture(enabled: enabled)
  }

  func setEnabledTiltGestures(enabled: Bool) {
    gestures.setEnabledTiltGesture(enabled: enabled)
  }

  func setEnabledZoomGestures(enabled: Bool) {
    gestures.setEnabledZoomGesture(enabled: enabled)
  }

  func setMapType(mapType: MapType) {
    var mapViewType: MKMapType
    switch mapType {
    case .hybrid:
      mapViewType = .hybrid
    case .satellite:
      mapViewType = .satellite
    case .normal, .terrain:
      mapViewType = .standard
    }
    mapView.mapType = mapViewType
  }

  func setEnabledPOISearching(enabled: Bool) {
    pointsOfInterest.setEnabledPOISearching(enabled: enabled)
  }

  public override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    let touchedView: UIView! = mapView.hitTest(point, with: event)
    if touchedView.isKind(of: NSClassFromString("_MKUserTrackingButton")!) {
      onLocationButtonPress(UserLocationRecord(location: mapView.userLocation).toDictionary())
    } else if touchedView.isKind(of: NSClassFromString("_MKUserLocationView")!) {
      onLocationDotPress(UserLocationRecord(location: mapView.userLocation).toDictionary())
      return touchedView.hitTest(point, with: event)
    }
    return super.hitTest(_: point, with: event)
  }

  func setEnabledPOIFilter(categories: [POICategoryType]) {
    pointsOfInterest.setEnabledPOIFilter(categories: categories)
  }

  func setEnabledPOIs(enabled: Bool) {
    pointsOfInterest.setEnabledPOIs(enabled: enabled)
  }

  func fetchPOISearchCompletions(searchQueryFragment: String, promise: Promise) {
    pointsOfInterest.fetchSearchCompletions(searchQueryFragment: searchQueryFragment, promise: promise)
  }

  func createPOISearchRequest(place: String) {
    pointsOfInterest.createSearchRequest(place: place)
  }

  func setMarkers(markerObjects: [MarkerObject]) {
    markers.setMarkers(markerObjects: markerObjects)
  }

  func setClusters(clusterObjects: [ClusterObject]) {
    delegate?.setClusters(clusterObjects: clusterObjects)
    clusters.setClusters(clusterObjects: clusterObjects)
  }

  func setPolygons(polygonObjects: [PolygonObject]) {
    polygons.setPolygons(polygonObjects: polygonObjects)
  }

  func setPolylines(polylineObjects: [PolylineObject]) {
    polylines.setPolylines(polylineObjects: polylineObjects)
  }

  func setCircles(circleObjects: [CircleObject]) {
    circles.setCircles(circleObjects: circleObjects)
  }

  func setInitialCameraPosition(initialCameraPosition: CameraMoveRecord) {
    if !wasInitialCameraPositionSet {
      cameraAnimator.moveCamera(cameraMove: initialCameraPosition, promise: nil)
      wasInitialCameraPositionSet = true
    }
  }

  func setEnabledTraffic(enableTraffic: Bool) {
    mapView.showsTraffic = enableTraffic
  }

  func setKMLs(kmlObjects: [KMLObject]) {
    kmls.setKMLs(kmlObjects: kmlObjects)
  }

  func setGeoJsons(geoJsonObjects: [GeoJsonObject]) {
    geoJsons.setGeoJsons(geoJsonObjects: geoJsonObjects)
  }

  func setOverlays(overlayObjects: [OverlayObject]) {}

  func convertToMapViewCoordinate(_ point: CGPoint) -> CLLocationCoordinate2D {
    mapView.convert(point, toCoordinateFrom: mapView)
  }

  // imitating Google Maps zoom level behaviour

  // based on https://gis.stackexchange.com/questions/7430/what-ratio-scales-do-google-maps-zoom-levels-correspond-to
  static func googleMapsZoomLevelToMeters(latitude: Double, zoom: Double) -> Double {
    let metersPerPixel = 156_543.033_92 * cos(latitude * Double.pi / 180) / pow(2, zoom - 1)
    return UIScreen.main.bounds.size.width * metersPerPixel
  }
}
