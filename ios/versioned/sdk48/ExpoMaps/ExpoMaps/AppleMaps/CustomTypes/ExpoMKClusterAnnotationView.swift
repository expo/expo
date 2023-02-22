import MapKit

class ExpoMKClusterColorAnnotationView: MKMarkerAnnotationView {
  override init(annotation: MKAnnotation?, reuseIdentifier: String?) {
    super.init(annotation: annotation, reuseIdentifier: reuseIdentifier)

    // Set in order to display annotation even if user zooms out
    displayPriority = .required
  }

  init(annotation: ExpoMKClusterColorAnnotation, reuseIdentifier: String?) {
    super.init(annotation: annotation, reuseIdentifier: reuseIdentifier)

    // Set in order to display annotation even if user zooms out
    displayPriority = .required
    markerTintColor = UIColor(hue: annotation.color, saturation: 1, brightness: 1, alpha: 1)
    alpha = annotation.alpha
  }

  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}

class ExpoMKClusterImageAnnotationView: MKAnnotationView {
  override init(annotation: MKAnnotation?, reuseIdentifier: String?) {
    super.init(annotation: annotation, reuseIdentifier: reuseIdentifier)

    // Set in order to display annotation even if user zooms out
    displayPriority = .required
    // For displaying data in a infoWindow when annotation is clicked
    canShowCallout = true
    isEnabled = true
  }

  init(annotation: ExpoMKClusterImageAnnotation, reuseIdentifier: String?) {
    super.init(annotation: annotation, reuseIdentifier: reuseIdentifier)

    // Set in order to display annotation even if user zooms out
    displayPriority = .required
    // For displaying data in a infoWindow when annotation is clicked
    canShowCallout = true
    isEnabled = true
    image = UIImage(contentsOfFile: annotation.icon)
    alpha = annotation.alpha
  }

  required init?(coder aDecoder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}
