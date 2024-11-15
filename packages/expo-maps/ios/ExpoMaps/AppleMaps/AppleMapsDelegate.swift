import MapKit

class AppleMapsDelegate: NSObject, MKMapViewDelegate {
  private let markersManager: AppleMapsMarkersManager
  //private let sendEvent: (String, [String: Any?]) -> Void
  // Dictionary which holds cluster names connected with clusters appearance data
  private var clusterObjects: [String: ClusterObject] = [:]
  private var finishedInitialLoad: Bool = false
  weak var appleMapsView: AppleMapsView?

  init(markersManager: AppleMapsMarkersManager, appleMapsView: AppleMapsView?) {
  //  self.sendEvent = sendEvent
    self.markersManager = markersManager
    self.appleMapsView = appleMapsView
    super.init()
  }

  func setClusters(clusterObjects: [ClusterObject]) {
    self.clusterObjects = [:]
    for clusterObject in clusterObjects {
      self.clusterObjects[clusterObject.name] = clusterObject
    }
  }

  func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
    switch overlay {
    case let polygon as ExpoMKPolygon:
      let renderer = MKPolygonRenderer(overlay: polygon)
      renderer.fillColor = polygon.fillColor
      renderer.strokeColor = polygon.strokeColor
      renderer.lineWidth = CGFloat(polygon.strokeWidth)
      if polygon.strokePattern != nil {
        renderer.lineDashPattern = polygon.strokePattern
      }
      renderer.lineJoin = polygon.jointType
      return renderer
    case let polyline as ExpoMKPolyline:
      let renderer = MKPolylineRenderer(overlay: polyline)
      renderer.strokeColor = polyline.color
      renderer.lineWidth = CGFloat(polyline.width)
      if polyline.pattern != nil {
        renderer.lineDashPattern = polyline.pattern
      }
      renderer.lineJoin = polyline.jointType
      renderer.lineCap = polyline.capType
      return renderer
    case let circle as ExpoMKCircle:
      let renderer = MKCircleRenderer(overlay: circle)
      renderer.fillColor = circle.fillColor
      renderer.strokeColor = circle.strokeColor
      renderer.lineWidth = CGFloat(circle.strokeWidth)
      return renderer
    default:
      return MKOverlayRenderer()
    }
  }

  /*
   annotation can be one of four possible MKAnnotation subclasses, for each of them queue is checked if it contains
   the particular instance. If so, its fields are set, otherwise new instance is created.
   */
  func mapView(_ mapView: MKMapView, viewFor annotation: MKAnnotation) -> MKAnnotationView? {
    if let annotation = annotation as? ExpoMKImageAnnotation {
      let view = mapView.dequeueReusableAnnotationView(withIdentifier: "image_marker")

      if let markerAnnotationView = view as? ExpoMKImageAnnotationView {
        markerAnnotationView.image = UIImage(contentsOfFile: annotation.icon)
        markerAnnotationView.isDraggable = annotation.isDraggable
        markerAnnotationView.centerOffset = CGPoint(x: annotation.centerOffsetX, y: annotation.centerOffsetY)
        markerAnnotationView.alpha = annotation.alpha
        markerAnnotationView.clusteringIdentifier = annotation.clusterName

        return markerAnnotationView
      } else {
        return ExpoMKImageAnnotationView(annotation: annotation, reuseIdentifier: "image_marker")
      }
    } else if let annotation = annotation as? ExpoMKColorAnnotation {
      let view = mapView.dequeueReusableAnnotationView(withIdentifier: "color_marker")

      if let markerAnnotationView = view as? ExpoMKColorAnnotationView {
        markerAnnotationView.markerTintColor = UIColor(hue: annotation.color, saturation: 1, brightness: 1, alpha: 1)
        markerAnnotationView.isDraggable = annotation.isDraggable
        markerAnnotationView.centerOffset = CGPoint(x: annotation.centerOffsetX, y: annotation.centerOffsetY)
        markerAnnotationView.alpha = annotation.alpha
        markerAnnotationView.clusteringIdentifier = annotation.clusterName

        return markerAnnotationView
      } else {
        return ExpoMKColorAnnotationView(annotation: annotation, reuseIdentifier: "color_marker")
      }
    } else if let annotation = annotation as? ExpoMKClusterImageAnnotation {
      let view = mapView.dequeueReusableAnnotationView(withIdentifier: "image_cluster")

      if let clusterAnnotationView = view as? ExpoMKClusterImageAnnotationView {
        clusterAnnotationView.image = UIImage(contentsOfFile: annotation.icon)
        clusterAnnotationView.alpha = annotation.alpha

        return clusterAnnotationView
      } else {
        return ExpoMKClusterImageAnnotationView(annotation: annotation, reuseIdentifier: "image_cluster")
      }
    } else if let annotation = annotation as? ExpoMKClusterColorAnnotation {
      let view = mapView.dequeueReusableAnnotationView(withIdentifier: "color_cluster")

      if let clusterAnnotationView = view as? ExpoMKClusterColorAnnotationView {
        clusterAnnotationView.markerTintColor = UIColor(hue: annotation.color, saturation: 1, brightness: 1, alpha: 1)
        clusterAnnotationView.alpha = annotation.alpha

        return clusterAnnotationView
      } else {
        return ExpoMKClusterColorAnnotationView(annotation: annotation, reuseIdentifier: "color_cluster")
      }
    } else {
      return nil
    }
  }

  /*
   Depending on memberAnnotation's clusterName and data paired with the name in clusterObjects dictionary
   ExpoMKClusterImageAnnotation or ExpoMKClusterColorAnnotation is created.
   */
  func mapView(_ mapView: MKMapView, clusterAnnotationForMemberAnnotations memberAnnotations: [MKAnnotation]) -> MKClusterAnnotation {
    if let expoAnnotation = memberAnnotations.first as? ExpoMKAnnotation {
      let clusterObject = clusterObjects[expoAnnotation.clusterName!]!

      let iconURL = (clusterObject.icon != nil) ? URL(fileURLWithPath: clusterObject.icon!) : nil

      if iconURL != nil {
        let clusterAnnotation = ExpoMKClusterImageAnnotation(memberAnnotations: memberAnnotations)
        clusterAnnotation.icon = iconURL!.standardized.path
        clusterAnnotation.id = clusterObject.id
        clusterAnnotation.minimumClusterSize = clusterObject.minimumClusterSize
        clusterAnnotation.title = clusterObject.markerTitle
        clusterAnnotation.subtitle = clusterObject.markerSnippet
        clusterAnnotation.alpha = clusterObject.opacity

        return clusterAnnotation
      } else {
        let clusterAnnotation = ExpoMKClusterColorAnnotation(memberAnnotations: memberAnnotations)
        var hue: CGFloat = 0
        clusterObject.color?.getHue(&hue, saturation: nil, brightness: nil, alpha: nil)
        clusterAnnotation.color = hue
        clusterAnnotation.id = clusterObject.id
        clusterAnnotation.minimumClusterSize = clusterObject.minimumClusterSize
        clusterAnnotation.title = clusterObject.markerTitle
        clusterAnnotation.subtitle = clusterObject.markerSnippet
        clusterAnnotation.alpha = clusterObject.opacity

        return clusterAnnotation
      }
    }

    return ExpoMKClusterColorAnnotation(memberAnnotations: memberAnnotations)
  }

  func mapViewDidChangeVisibleRegion(_ mapView: MKMapView) {
    appleMapsView?.onRegionChange(
      CameraPositionRecord(camera: mapView.camera, coordinateSpan: mapView.region.span).toDictionary()
    )
  }

  func mapView(_ mapView: MKMapView, regionWillChangeAnimated animated: Bool) {
    appleMapsView?.onRegionChangeStarted(
      CameraPositionRecord(camera: mapView.camera, coordinateSpan: mapView.region.span).toDictionary()
    )
  }

  func mapView(_ mapView: MKMapView, regionDidChangeAnimated animated: Bool) {
    appleMapsView?.onRegionChangeComplete(
      CameraPositionRecord(camera: mapView.camera, coordinateSpan: mapView.region.span).toDictionary()
    )
  }

  func mapViewDidFinishRenderingMap(_ mapView: MKMapView, fullyRendered: Bool) {
    if !finishedInitialLoad {
      // TOOD: pass null instead of empty dict
      appleMapsView?.onMapLoaded([:])
      finishedInitialLoad = true
    }
  }

  func mapView(_ mapView: MKMapView, didSelect view: MKAnnotationView) {
    if let annotation = view.annotation as? ExpoMKAnnotation {
      appleMapsView?.onMarkerPress(MarkerRecord(marker: annotation).toDictionary())
    }
#if HAS_GOOGLE_UTILS
    if let annotation = view.annotation as? ExpoMKClusterAnnotation {
      appleMapsView?.onClusterPress(ClusterRecord(cluster: annotation).toDictionary())
    }
#endif
  }

  func mapView(
    _ mapView: MKMapView,
    annotationView view: MKAnnotationView,
    didChange newState: MKAnnotationView.DragState,
    fromOldState oldState: MKAnnotationView.DragState
  ) {
    if let annotation = view.annotation as? ExpoMKAnnotation {
      switch newState {
      case .starting:
        appleMapsView?.onMarkerDragStarted(MarkerRecord(marker: annotation).toDictionary())
        view.addObserver(self, forKeyPath: "center", options: NSKeyValueObservingOptions.new, context: nil)
      case .dragging:
        appleMapsView?.onMarkerDrag(MarkerRecord(marker: annotation).toDictionary())
      case .ending:
        view.removeObserver(self, forKeyPath: "center")
        appleMapsView?.onMarkerDragComplete(MarkerRecord(marker: annotation).toDictionary())
      default: return
      }
    }
  }

  func mapView(_ mapView: MKMapView, didUpdate userLocation: MKUserLocation) {
    appleMapsView?.onLocationChange(UserLocationRecord(location: userLocation).toDictionary())
  }

  // swiftlint:disable block_based_kvo
  override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey: Any]?, context: UnsafeMutableRawPointer?) {
    if keyPath == "center" {
      if let view = object as? MKAnnotationView {
        let newPosition = CGPoint(x: view.center.x - view.centerOffset.x, y: view.center.y - view.centerOffset.y)
        let coordinate = appleMapsView?.convertToMapViewCoordinate(newPosition)
        if let annotation = view.annotation as? ExpoMKColorAnnotation {
          appleMapsView?.onMarkerDrag(MarkerRecord(id: annotation.id!, position: coordinate!).toDictionary())
        } else if let annotation = view.annotation as? ExpoMKAnnotation {
          appleMapsView?.onMarkerDrag(MarkerRecord(id: annotation.id!, position: coordinate!).toDictionary())
        }
      }
    } else {
      super.observeValue(forKeyPath: keyPath, of: object, change: change, context: context)
    }
  }
}
