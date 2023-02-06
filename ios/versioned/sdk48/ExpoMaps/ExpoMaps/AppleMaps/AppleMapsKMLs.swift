import MapKit
import ABI48_0_0ExpoModulesCore

class AppleMapsKMLs: NSObject, XMLParserDelegate, KMLs {
  private let mapView: MKMapView
  private let markers: AppleMapsMarkers
  private let polylines: AppleMapsPolylines
  private let polygons: AppleMapsPolygons

  private var kmlGeometryElements: [KMLTag] = []
  private var kmlStyleElements: [String: KMLTag] = [:]

  private var openedKMLTags: [KMLTag] = []
  private var currentString: String = ""

  init(mapView: MKMapView, markers: AppleMapsMarkers, polylines: AppleMapsPolylines, polygons: AppleMapsPolygons) {
    self.mapView = mapView
    self.markers = markers
    self.polylines = polylines
    self.polygons = polygons
  }

  func parser(
    _ parser: XMLParser,
    didStartElement elementName: String,
    namespaceURI: String?,
    qualifiedName qName: String?,
    attributes attributeDict: [String: String] = [:]
  ) {
    currentString = ""
    var element: KMLTag?

    switch elementName {
    case KMLTagName.style:
      element = KMLStyleElement()
    case KMLTagName.cascadingStyle:
      element = KMLCascadingStyleElement()
    case KMLTagName.styleMap:
      element = KMLStyleMapElement()
    case KMLTagName.pair:
      element = KMLStylePairElement()
    case KMLTagName.polyStyle:
      element = KMLPolyStyleElement()
    case KMLTagName.lineStyle:
      element = KMLLineStyleElement()
    case KMLTagName.iconStyle:
      element = KMLIconStyleElement()
    case KMLTagName.document:
      element = KMLDocumentElement()
    case KMLTagName.folder:
      element = KMLFolderElement()
    case KMLTagName.placemark:
      element = KMLPlacemarkElement()
    case KMLTagName.point:
      element = KMLPointElement()
    case KMLTagName.multiGeometry:
      element = KMLMultiGeometryElement()
    case KMLTagName.lineString:
      element = KMLLineElement()
    case KMLTagName.linearRing:
      element = KMLLinearRingElement()
    case KMLTagName.polygon:
      element = KMLPolygonElement()
    case KMLTagName.outerBoundary:
      element = KMLOuterBoundaryElement()
    case KMLTagName.kml:
      element = KMLElement()
    default:
      break
    }

    element?.handleOnStartTag(
      attributeDict: attributeDict,
      openedKMLTags: &openedKMLTags,
      kmlStyleElements: &kmlStyleElements,
      kmlGeometryElements: &kmlGeometryElements
    )
  }

  func parser(_ parser: XMLParser, foundCharacters string: String) {
    currentString += string
  }

  func parser(_ parser: XMLParser, didEndElement elementName: String, namespaceURI: String?, qualifiedName qName: String?) {
    let lastElement = openedKMLTags.last

    switch elementName {
    case KMLTagName.style,
      KMLTagName.cascadingStyle,
      KMLTagName.styleMap,
      KMLTagName.pair,
      KMLTagName.polyStyle,
      KMLTagName.lineStyle,
      KMLTagName.iconStyle,
      KMLTagName.placemark,
      KMLTagName.folder,
      KMLTagName.document,
      KMLTagName.point,
      KMLTagName.multiGeometry,
      KMLTagName.lineString,
      KMLTagName.linearRing,
      KMLTagName.outerBoundary,
      KMLTagName.polygon,
      KMLTagName.kml:
      if elementName == lastElement?.tagName {
        lastElement?.handleOnEndTag(
          elementName: elementName,
          tagContent: currentString,
          openedKMLTags: &openedKMLTags,
          kmlStyleElements: &kmlStyleElements,
          kmlGeometryElements: &kmlGeometryElements
        )
      }
    case KMLTagName.color,
      KMLTagName.width,
      KMLTagName.key,
      KMLTagName.styleUrl,
      KMLTagName.coordinates,
      KMLTagName.name:
      lastElement?.handleContent(
        elementName: elementName,
        tagContent: currentString,
        contentAttributeDict: [:],
        openedKMLTags: &openedKMLTags,
        kmlStyleElements: &kmlStyleElements,
        kmlGeometryElements: &kmlGeometryElements
      )
    default:
      break
    }
  }

  func setKMLs(kmlObjects: [KMLObject]) {
    kmlGeometryElements = []
    kmlStyleElements = [:]

    for kmlObject in kmlObjects {
      let kmlFilePath = URL(fileURLWithPath: kmlObject.filePath).standardized

      if let parser = XMLParser(contentsOf: kmlFilePath) {
        parser.delegate = self
        parser.parse()
      }
    }

    drawMarkers()
    drawPolylines()
    drawPolygons()
  }

  private func drawMarkers() {
    let kmlPoints: [KMLPointElement] = kmlGeometryElements.filter { element in
      element.tagName == KMLTagName.point
    } as? [KMLPointElement] ?? []

    let markerObjects: [MarkerObject] = kmlPoints.map { point in
      let markerStyle = extractStyle(styleElement: kmlStyleElements[point.styleId ?? ""], lookingFor: KMLTagName.iconStyle) as? KMLIconStyleElement

      let color = UIColor.init(hexString: markerStyle?.color ?? "")

      return MarkerObject(
        latitude: point.coordinate.latitude,
        longitude: point.coordinate.longitude,
        markerTitle: Field(wrappedValue: point.title),
        markerSnippet: Field(),
        icon: Field(),
        color: Field(wrappedValue: color),
        draggable: false,
        anchorU: Field(),
        anchorV: Field(),
        opacity: 1
      )
    }

    markers.setKMLMarkers(markerObjects: markerObjects)
  }

  private func drawPolylines() {
    let lines = kmlGeometryElements.first { $0.tagName == KMLTagName.lineString }
    guard let kmlLines = lines as? [KMLLineElement] else {
      return
    }

    let polylineObjects = kmlLines.map { line in
      let polylineStyle = extractStyle(styleElement: kmlStyleElements[line.styleId ?? ""], lookingFor: KMLTagName.lineStyle) as? KMLLineStyleElement

      let points = line.coordinates.map { coordinate in Point(latitude: coordinate.latitude, longitude: coordinate.longitude) }
      let color = UIColor.init(hexString: polylineStyle?.color ?? "")

      return PolylineObject(
        points: points,
        color: Field(wrappedValue: color),
        width: Field(wrappedValue: polylineStyle?.width),
        pattern: Field(),
        jointType: Field(),
        capType: Field()
      )
    }

    polylines.setKMLPolylines(polylineObjects: polylineObjects)
  }

  private func drawPolygons() {
    let kmlPolygons: [KMLPolygonElement] = kmlGeometryElements.filter { element in
      element.tagName == KMLTagName.polygon
    } as? [KMLPolygonElement] ?? []

    let polygonObjects: [PolygonObject] = kmlPolygons.map { polygon in
      let polygonStyle = extractStyle(styleElement: kmlStyleElements[polygon.styleId ?? ""], lookingFor: KMLTagName.polyStyle) as? KMLPolyStyleElement
      let polylineStyle = extractStyle(styleElement: kmlStyleElements[polygon.styleId ?? ""], lookingFor: KMLTagName.lineStyle) as? KMLLineStyleElement

      let points = polygon.coordinates.map { coordinate in Point(latitude: coordinate.latitude, longitude: coordinate.longitude) }
      let width = polylineStyle?.width ?? 1.0
      var fillColor: UIColor?
      var outlineColor: UIColor?

      if polylineStyle?.color != nil {
        outlineColor = UIColor.init(hexString: polylineStyle!.color!)
      }

      if polygonStyle?.color != nil {
        fillColor = UIColor.init(hexString: polygonStyle!.color!)
      }

      return PolygonObject(
        points: points,
        fillColor: Field(wrappedValue: fillColor),
        strokeColor: Field(wrappedValue: outlineColor),
        strokeWidth: Field(wrappedValue: width),
        strokePattern: Field(),
        jointType: Field()
      )
    }

    polygons.setKMLPolygons(polygonObjects: polygonObjects)
  }

  private func extractStyle(styleElement: KMLTag?, lookingFor: String) -> KMLTag? {
    switch styleElement {
    case is KMLStyleElement:
      guard let styleElement = styleElement as? KMLStyleElement else {
        return nil
      }
      switch lookingFor {
      case KMLTagName.iconStyle:
        return styleElement.iconStyle
      case KMLTagName.lineStyle:
        return styleElement.lineStyle
      case KMLTagName.polyStyle:
        return styleElement.polyStyle
      default:
        return nil
      }
    case let cascading as KMLCascadingStyleElement:
      return extractStyle(styleElement: cascading.styleElement, lookingFor: lookingFor)
    case let stylePair as KMLStylePairElement:
      return extractStyle(styleElement: stylePair.styleElement, lookingFor: lookingFor)
    case let styleMap as KMLStyleMapElement:
      return extractStyle(styleElement: styleMap.styleElement, lookingFor: lookingFor)
    default:
      return nil
    }
  }
}
