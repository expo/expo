import MapKit

/*
 Returns asset based marker icon when markerObject.icon is not null, otherwise returns default marker with provided color.
 */
func createAppleMarker(markerObject: MarkerObject, includeDragging: Bool) -> ExpoMKAnnotation {
  let iconURL = (markerObject.icon != nil) ? URL(fileURLWithPath: markerObject.icon!) : nil

  if iconURL != nil {
    let marker = ExpoMKImageAnnotation(coordinate: CLLocationCoordinate2D(latitude: markerObject.latitude, longitude: markerObject.longitude))
    marker.id = markerObject.id
    marker.title = markerObject.markerTitle
    marker.subtitle = markerObject.markerSnippet
    marker.icon = iconURL!.standardized.path
    marker.centerOffsetX = markerObject.anchorU ?? 0
    marker.centerOffsetY = markerObject.anchorV ?? 0
    marker.alpha = markerObject.opacity

    if includeDragging {
      marker.isDraggable = markerObject.draggable
    }

    return marker
  } else {
    let marker = ExpoMKColorAnnotation(coordinate: CLLocationCoordinate2D(latitude: markerObject.latitude, longitude: markerObject.longitude))
    var hue: CGFloat = 0
    markerObject.color?.getHue(&hue, saturation: nil, brightness: nil, alpha: nil)
    marker.id = markerObject.id
    marker.title = markerObject.markerTitle
    marker.subtitle = markerObject.markerSnippet
    marker.color = hue
    marker.centerOffsetX = markerObject.anchorU ?? 0
    marker.centerOffsetY = markerObject.anchorV ?? 0
    marker.alpha = markerObject.opacity

    if includeDragging {
      marker.isDraggable = markerObject.draggable
    }

    return marker
  }
}

func jointToCGLineJoin(_ jointType: Joint?) -> CGLineJoin {
  switch jointType {
  case .miter:
    return .miter
  case .round:
    return .round
  case .bevel:
    return .bevel
  default:
    return .round
  }
}

func strokePatternToLineDashPatternPolygon(pattern: [PatternItem]?, width: Float = 2) -> [NSNumber]? {
  guard let pattern = pattern else {
    return nil
  }
  var LDP: [Float] = []
  for patternItem in pattern {
    switch (patternItem.type, LDP.count % 2) {
    case (.stroke, 0):
      LDP.append(patternItem.length)
    case (.stroke, _):
      LDP[LDP.count - 1] = (LDP.last ?? 0) + patternItem.length
    case (.gap, 1):
      LDP.append(patternItem.length)
    case _:
      if !LDP.isEmpty {
        LDP[LDP.count - 1] = (LDP.last ?? 0) + patternItem.length
      }
    }
  }
  return LDP.map { NSNumber(value: $0) }
}

func strokePatternToLineDashPatternPolyline(pattern: [PatternItem]?, dotLength: Float) -> [NSNumber]? {
  guard let pattern = pattern else {
    return nil
  }
  var LDP: [Float] = []
  for patternItem in pattern {
    // Parity of so-far array is the easiest indicator, whether last inserted element is a stroke or a gap
    switch (patternItem.type, patternItem.length, LDP.count % 2) {
    case (.stroke, 0, 0):  // Dot after gap
      LDP.append(dotLength)
      LDP.append(1)
    case (.stroke, _, 0):  // Dash after gap
      LDP.append(patternItem.length)
    case (.stroke, _, 0):  // Dot after dash
      LDP.append(1)
      LDP.append(dotLength)
      LDP.append(1)
    case (.stroke, _, _):  // Dash after dash (merge)
      LDP[LDP.count - 1] = (LDP.last ?? 0) + patternItem.length
    case (.gap, _, 1):  // Gap after any stroke
      LDP.append(patternItem.length)
    case _:  // Gap after gap (merge)
      if !LDP.isEmpty {
        LDP[LDP.count - 1] = (LDP.last ?? 0) + patternItem.length
      }
    }
  }
  return LDP.map { NSNumber(value: $0) }
}
