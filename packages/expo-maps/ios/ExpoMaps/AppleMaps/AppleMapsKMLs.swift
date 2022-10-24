import MapKit

class AppleMapsKMLs : NSObject, XMLParserDelegate, KMLs {
  
  private let mapView: MKMapView
  private let markers: AppleMapsMarkers
  private let polylines: AppleMapsPolylines
  private let polygons: AppleMapsPolygons
  
  private var kmlGeometryElements: [KMLTag] = []
  private var kmlStyleElements: Dictionary<String, KMLTag> = [:]
  
  private var openedKMLTags: [KMLTag] = []
  private var currentString: String = ""
  
  init(mapView: MKMapView, markers: AppleMapsMarkers, polylines: AppleMapsPolylines, polygons: AppleMapsPolygons) {
    self.mapView = mapView
    self.markers = markers
    self.polylines = polylines
    self.polygons = polygons
  }
  
  func parser(_ parser: XMLParser, didStartElement elementName: String, namespaceURI: String?, qualifiedName qName: String?, attributes attributeDict: [String : String] = [:]) {
    currentString = ""
    var element: KMLTag?
    
    switch (elementName) {
    case KMLTagName.style:
      element = KMLStyleElement()
      break
    case KMLTagName.cascadingStyle:
      element = KMLCascadingStyleElement()
      break
    case KMLTagName.styleMap:
      element = KMLStyleMapElement()
      break
    case KMLTagName.pair:
      element = KMLStylePairElement()
      break
    case KMLTagName.polyStyle:
      element = KMLPolyStyleElement()
      break
    case KMLTagName.lineStyle:
      element = KMLLineStyleElement()
      break
    case KMLTagName.iconStyle:
      element = KMLIconStyleElement()
      break
    case KMLTagName.document:
      element = KMLDocumentElement()
      break
    case KMLTagName.folder:
      element = KMLFolderElement()
      break
    case KMLTagName.placemark:
      element = KMLPlacemarkElement()
      break
    case KMLTagName.point:
      element = KMLPointElement()
      break
    case KMLTagName.multiGeometry:
      element = KMLMultiGeometryElement()
      break
    case KMLTagName.lineString:
      element = KMLLineElement()
      break
    case KMLTagName.linearRing:
      element = KMLLinearRingElement()
      break
    case KMLTagName.polygon:
      element = KMLPolygonElement()
      break
    case KMLTagName.outerBoundary:
      element = KMLOuterBoundaryElement()
      break
    case KMLTagName.kml:
      element = KMLElement()
      break
    default:
      break
    }
    
    element?.handleOnStartTag(attributeDict: attributeDict, openedKMLTags: &openedKMLTags, kmlStyleElements: &kmlStyleElements, kmlGeometryElements: &kmlGeometryElements)
  }
  
  func parser(_ parser: XMLParser, foundCharacters string: String) {
    currentString += string
  }
  
  func parser(_ parser: XMLParser, didEndElement elementName: String, namespaceURI: String?, qualifiedName qName: String?) {
    let lastElement = openedKMLTags.last
    
    switch (elementName) {
    case KMLTagName.style, KMLTagName.cascadingStyle, KMLTagName.styleMap, KMLTagName.pair, KMLTagName.polyStyle, KMLTagName.lineStyle, KMLTagName.iconStyle, KMLTagName.iconStyle, KMLTagName.placemark, KMLTagName.folder, KMLTagName.document, KMLTagName.point, KMLTagName.multiGeometry, KMLTagName.lineString, KMLTagName.linearRing, KMLTagName.outerBoundary, KMLTagName.polygon, KMLTagName.kml:
      if (elementName == lastElement?.tagName) {
        lastElement?.handleOnEndTag(elementName: elementName, tagContent: currentString, openedKMLTags: &openedKMLTags, kmlStyleElements: &kmlStyleElements, kmlGeometryElements: &kmlGeometryElements)
      }
      break
    case KMLTagName.color, KMLTagName.width, KMLTagName.key, KMLTagName.styleUrl, KMLTagName.coordinates, KMLTagName.name:
      lastElement?.handleContent(elementName: elementName, tagContent: currentString, contentAttributeDict: [:], openedKMLTags: &openedKMLTags, kmlStyleElements: &kmlStyleElements, kmlGeometryElements: &kmlGeometryElements)
      break
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
    } as! [KMLPointElement]
    
    let markerObjects: [MarkerObject] = kmlPoints.map { point in
      let markerStyle = extractStyle(styleElement: kmlStyleElements[point.styleId ?? ""], lookingFor: KMLTagName.iconStyle) as? KMLIconStyleElement
      
      let color = UIColor.init(hexString: markerStyle?.color ?? "")
      
      return MarkerObject(latitude: point.coordinate.latitude, longitude: point.coordinate.longitude, markerTitle: point.title, markerSnippet: nil, icon: nil, color: color, draggable: false, anchorU: nil, anchorV: nil, opacity: 1)
    }
    
    markers.setKMLMarkers(markerObjects: markerObjects)
  }
  
  private func drawPolylines() {
    let kmlLines: [KMLLineElement] = kmlGeometryElements.filter { element in
      element.tagName == KMLTagName.lineString
    } as! [KMLLineElement]

    let polylineObjects: [PolylineObject] = kmlLines.map { line in
      let polylineStyle = extractStyle(styleElement: kmlStyleElements[line.styleId ?? ""], lookingFor: KMLTagName.lineStyle) as? KMLLineStyleElement

      let points = line.coordinates.map { coordinate in Point(latitude: coordinate.latitude, longitude: coordinate.longitude) }
      let color = UIColor.init(hexString: polylineStyle?.color ?? "")
      
      return PolylineObject(points: points, color: color, width: polylineStyle?.width, pattern: nil, jointType: nil, capType: nil)
    }
    
    polylines.setKMLPolylines(polylineObjects: polylineObjects)
  }
  
  private func drawPolygons() {
    let kmlPolygons: [KMLPolygonElement] = kmlGeometryElements.filter { element in
      element.tagName == KMLTagName.polygon
    } as! [KMLPolygonElement]
    
    let polygonObjects: [PolygonObject] = kmlPolygons.map { polygon in
      let polygonStyle = extractStyle(styleElement: kmlStyleElements[polygon.styleId ?? ""], lookingFor: KMLTagName.polyStyle) as? KMLPolyStyleElement
      let polylineStyle = extractStyle(styleElement: kmlStyleElements[polygon.styleId ?? ""], lookingFor: KMLTagName.lineStyle) as? KMLLineStyleElement
      
      let points = polygon.coordinates.map { coordinate in Point(latitude: coordinate.latitude, longitude: coordinate.longitude) }
      let width = polylineStyle?.width ?? 1.0
      var fillColor: UIColor? = nil
      var outlineColor: UIColor? = nil
      
      if (polylineStyle?.color != nil) {
        outlineColor = UIColor.init(hexString: polylineStyle!.color!)
      }
      
      if (polygonStyle?.color != nil) {
        fillColor = UIColor.init(hexString: polygonStyle!.color!)
      }
      
      return PolygonObject(points: points, fillColor: fillColor, strokeColor: outlineColor, strokeWidth: width, strokePattern: nil, jointType: nil)
    }
    
    polygons.setKMLPolygons(polygonObjects: polygonObjects)
  }
  
  private func extractStyle(styleElement: KMLTag?, lookingFor: String) -> KMLTag? {
    switch(styleElement) {
    case is KMLStyleElement:
      let styleElement = styleElement as! KMLStyleElement
      switch(lookingFor) {
      case KMLTagName.iconStyle:
        return styleElement.iconStyle
      case KMLTagName.lineStyle:
        return styleElement.lineStyle
      case KMLTagName.polyStyle:
        return styleElement.polyStyle
      default:
        return nil
      }
    case is KMLCascadingStyleElement:
      return extractStyle(styleElement: (styleElement as! KMLCascadingStyleElement).styleElement, lookingFor: lookingFor)
    case is KMLStylePairElement:
      return extractStyle(styleElement: (styleElement as! KMLStylePairElement).styleElement, lookingFor: lookingFor)
    case is KMLStyleMapElement:
      return extractStyle(styleElement: (styleElement as! KMLStyleMapElement).styleElement, lookingFor: lookingFor)
    default:
      return nil
    }
  }
}
