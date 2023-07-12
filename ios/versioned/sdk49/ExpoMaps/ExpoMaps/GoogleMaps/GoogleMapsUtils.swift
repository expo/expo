import GoogleMaps

/*
 Returns asset based marker icon when markerObject.icon is not null, otherwise returns default marker with provided color.
 */
func createGoogleMarker(markerObject: MarkerObject, includeDragging: Bool) -> GMSMarker {
  let position = CLLocationCoordinate2D(latitude: markerObject.latitude, longitude: markerObject.longitude)
  let marker = GMSMarker(position: position)
  let iconURL = (markerObject.icon != nil) ? URL(fileURLWithPath: markerObject.icon!) : nil
  marker.title = markerObject.markerTitle
  marker.snippet = markerObject.markerSnippet

  if includeDragging {
    marker.isDraggable = markerObject.draggable
  }

  marker.groundAnchor = CGPoint(x: markerObject.anchorU ?? 0.5, y: markerObject.anchorV ?? 1)
  marker.opacity = Float(markerObject.opacity)

  if iconURL != nil {
    marker.icon = UIImage(contentsOfFile: iconURL!.standardized.path)
  } else {
    marker.icon = GMSMarker.markerImage(with: markerObject.color)
  }

  return marker
}
