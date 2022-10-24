import MapKit

class ExpoMKColorAnnotationView: MKMarkerAnnotationView, UIGestureRecognizerDelegate {
  override init(annotation: MKAnnotation?, reuseIdentifier: String?) {
    super.init(annotation: annotation, reuseIdentifier: reuseIdentifier)

    // Set in order to display annotation even if user zooms out
    displayPriority = .required
  }

  init(annotation: ExpoMKColorAnnotation, reuseIdentifier: String?) {
    super.init(annotation: annotation, reuseIdentifier: reuseIdentifier)

    // Set in order to display annotation even if user zooms out
    displayPriority = .required
    isDraggable = annotation.isDraggable
    centerOffset = CGPoint(x: annotation.centerOffsetX, y: annotation.centerOffsetY)
    alpha = annotation.alpha
    markerTintColor = UIColor(hue: annotation.color, saturation: 1, brightness: 1, alpha: 1)
    clusteringIdentifier = annotation.clusterName
  }

  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}

class ExpoMKImageAnnotationView: MKAnnotationView {
  override init(annotation: MKAnnotation?, reuseIdentifier: String?) {
    super.init(annotation: annotation, reuseIdentifier: reuseIdentifier)

    // Set in order to display annotation even if user zooms out
    displayPriority = .required
    // For displaying data in a infoWindow when annotation is clicked
    canShowCallout = true
    isEnabled = true
  }

  init(annotation: ExpoMKImageAnnotation, reuseIdentifier: String?) {
    super.init(annotation: annotation, reuseIdentifier: reuseIdentifier)

    // Set in order to display annotation even if user zooms out
    displayPriority = .required
    // For displaying data in a infoWindow when annotation is clicked
    canShowCallout = true
    isEnabled = true
    isDraggable = annotation.isDraggable
    centerOffset = CGPoint(x: annotation.centerOffsetX, y: annotation.centerOffsetY)
    alpha = annotation.alpha
    image = UIImage(contentsOfFile: annotation.icon)
    clusteringIdentifier = annotation.clusterName
  }

  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}
