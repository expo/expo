// swiftlint:disable file_length
// swiftlint:disable function_parameter_count
protocol KMLTag {
  var tagName: String { get }
  var styleId: String? { get }

  func handleOnStartTag(
    attributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  )

  func handleContent(
    elementName: String,
    tagContent: String,
    contentAttributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  )

  func handleOnEndTag(
    elementName: String,
    tagContent: String,
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  )

  func updateStyleWithParentStyleId(styleId: String)

  func updateChildrenStyle()
}

extension KMLTag {
  func handleContent(
    elementName: String,
    tagContent: String,
    contentAttributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) { }

  func updateStyleWithParentStyleId(styleId: String) { }

  func updateChildrenStyle() { }
}

class KMLElement: KMLTag {
  private(set) var tagName: String = KMLTagName.kml
  private(set) var styleId: String?

  func handleOnStartTag(
    attributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    openedKMLTags.append(self)
  }

  func handleOnEndTag(
    elementName: String,
    tagContent: String,
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    mapStylePairs(kmlStyleElements: &kmlStyleElements)
  }
}

class KMLPolyStyleElement: KMLTag {
  private(set) var tagName: String = KMLTagName.polyStyle
  var styleId: String?
  var color: String?

  func handleOnStartTag(
    attributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    if let id = attributeDict["id"] {
      styleId = id
    }
    openedKMLTags.append(self)
  }

  func handleContent(
    elementName: String,
    tagContent: String,
    contentAttributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    if elementName == KMLTagName.color {
      color = tagContent
    }
  }

  func handleOnEndTag(
    elementName: String,
    tagContent: String,
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    if styleId != nil {
      kmlStyleElements[styleId!] = self
    }
    let penultimateStyleElement = openedKMLTags.penultimate()
    (penultimateStyleElement as? KMLStyleElement)?.polyStyle = self
    openedKMLTags.removeLast()
  }
}

class KMLLineStyleElement: KMLTag {
  private(set) var tagName: String = KMLTagName.lineStyle
  var styleId: String?
  var color: String?
  var width: Float = 1

  func handleOnStartTag(
    attributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    if let id = attributeDict["id"] {
      styleId = id
    }
    openedKMLTags.append(self)
  }

  func handleContent(
    elementName: String,
    tagContent: String,
    contentAttributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    switch elementName {
    case KMLTagName.color:
      color = tagContent
    case KMLTagName.width:
      width = Float(tagContent) ?? 1
    default:
      break
    }
  }

  func handleOnEndTag(
    elementName: String,
    tagContent: String,
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    if styleId != nil {
      kmlStyleElements[styleId!] = self
    }
    let penultimateStyleElement = openedKMLTags.penultimate()
    (penultimateStyleElement as? KMLStyleElement)?.lineStyle = self
    openedKMLTags.removeLast()
  }
}

class KMLIconStyleElement: KMLTag {
  private(set) var tagName: String = KMLTagName.iconStyle
  var styleId: String?
  var color: String?

  func handleOnStartTag(
    attributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    if let id = attributeDict["id"] {
      styleId = id
    }
    openedKMLTags.append(self)
  }

  func handleContent(
    elementName: String,
    tagContent: String,
    contentAttributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    if elementName == KMLTagName.color {
      color = tagContent
    }
  }

  func handleOnEndTag(
    elementName: String,
    tagContent: String,
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    if styleId != nil {
      kmlStyleElements[styleId!] = self
    }
    let penultimateStyleElement = openedKMLTags.penultimate()
    (penultimateStyleElement as? KMLStyleElement)?.iconStyle = self
    openedKMLTags.removeLast()
  }
}

class KMLStyleElement: KMLTag {
  private(set) var tagName: String = KMLTagName.style
  var styleId: String?
  var polyStyle: KMLPolyStyleElement?
  var lineStyle: KMLLineStyleElement?
  var iconStyle: KMLIconStyleElement?

  func handleOnStartTag(
    attributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    if let id = attributeDict["id"] {
      styleId = id
    }
    openedKMLTags.append(self)
  }

  func handleOnEndTag(
    elementName: String,
    tagContent: String,
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    if styleId != nil {
      kmlStyleElements[styleId!] = self
    }
    let penultimateStyleElement = openedKMLTags.penultimate()
    (penultimateStyleElement as? KMLCascadingStyleElement)?.styleElement = self
    openedKMLTags.removeLast()
  }
}

class KMLCascadingStyleElement: KMLTag {
  private(set) var tagName: String = KMLTagName.cascadingStyle
  var styleId: String?
  var styleElement: KMLStyleElement?

  func handleOnStartTag(
    attributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    if let id = attributeDict["kml:id"] {
      styleId = id
    }
    openedKMLTags.append(self)
  }

  func handleOnEndTag(
    elementName: String,
    tagContent: String,
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    if styleId != nil {
      kmlStyleElements[styleId!] = self
    }
    openedKMLTags.removeLast()
  }
}

class KMLStyleMapElement: KMLTag {
  private(set) var tagName: String = KMLTagName.styleMap
  var styleId: String?
  var styleElement: KMLTag?

  func handleOnStartTag(
    attributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    if let id = attributeDict["id"] {
      styleId = id
    }
    openedKMLTags.append(self)
  }

  func handleOnEndTag(
    elementName: String,
    tagContent: String,
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    if styleId != nil {
      kmlStyleElements[styleId!] = self
    }
    openedKMLTags.removeLast()
  }
}

class KMLStylePairElement: KMLTag {
  private(set) var tagName: String = KMLTagName.pair
  private(set) var styleId: String?
  private(set) var referencedStyleId: String?
  var styleElement: KMLTag?
  var isNormal: Bool = true

  func handleOnStartTag(
    attributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    openedKMLTags.append(self)
  }

  func handleContent(
    elementName: String,
    tagContent: String,
    contentAttributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    switch elementName {
    case KMLTagName.key:
      isNormal = (tagContent == "normal")
    case KMLTagName.styleUrl:
      var trimmedTagContent = tagContent
      trimmedTagContent.removeFirst()
      referencedStyleId = trimmedTagContent
    default:
      break
    }
  }

  func handleOnEndTag(
    elementName: String,
    tagContent: String,
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    if isNormal {
      let penultimateStyleElement = openedKMLTags.penultimate()
      (penultimateStyleElement as? KMLStyleMapElement)?.styleElement = self
    }
    openedKMLTags.removeLast()
  }
}

enum KMLTagType {
  case feature
  case geometry
  case style
  case auxiliary
}

class KMLDocumentElement: KMLTag {
  private(set) var tagName: String = KMLTagName.document
  var styleId: String?
  var featureElements: [KMLTag] = []

  func handleOnStartTag(
    attributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    openedKMLTags.append(self)
  }

  func handleContent(
    elementName: String,
    tagContent: String,
    contentAttributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    if elementName == KMLTagName.styleUrl {
      styleId = tagContent
      styleId?.removeFirst()
    }
  }

  func handleOnEndTag(
    elementName: String,
    tagContent: String,
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    updateChildrenStyle()
    openedKMLTags.removeLast()
  }

  func updateStyleWithParentStyleId(styleId: String) {
    if self.styleId == nil {
      self.styleId = styleId
      for featureElement in featureElements {
        featureElement.updateStyleWithParentStyleId(styleId: styleId)
      }
    }
  }

  func updateChildrenStyle() {
    if self.styleId != nil {
      for featureElement in featureElements {
        featureElement.updateStyleWithParentStyleId(styleId: self.styleId!)
      }
    }
  }
}

class KMLPlacemarkElement: KMLTag {
  private(set) var tagName: String = KMLTagName.placemark
  var styleId: String?
  var geometryElement: KMLTag?
  var title: String?

  func handleOnStartTag(
    attributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    openedKMLTags.append(self)
  }

  func handleContent(
    elementName: String,
    tagContent: String,
    contentAttributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    switch elementName {
    case KMLTagName.styleUrl:
      styleId = tagContent
      styleId?.removeFirst()
    case KMLTagName.name:
      title = tagContent
    default:
      break
    }
  }

  func handleOnEndTag(
    elementName: String,
    tagContent: String,
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    extractGeometryElementsAndAppendTitle(kmlGeometry: geometryElement, kmlGeometryElements: &kmlGeometryElements, title: title)

    let penultimateContentElement = openedKMLTags.penultimate()
    (penultimateContentElement as? KMLFolderElement)?.featureElements.append(self)
    (penultimateContentElement as? KMLDocumentElement)?.featureElements.append(self)

    updateChildrenStyle()
    openedKMLTags.removeLast()
  }

  func updateStyleWithParentStyleId(styleId: String) {
    if self.styleId == nil {
      self.styleId = styleId
      geometryElement?.updateStyleWithParentStyleId(styleId: styleId)
    }
  }

  func updateChildrenStyle() {
    if self.styleId != nil {
      geometryElement?.updateStyleWithParentStyleId(styleId: self.styleId!)
    }
  }
}

class KMLFolderElement: KMLTag {
  private(set) var tagName: String = KMLTagName.folder
  var styleId: String?
  var featureElements: [KMLTag] = []

  func handleOnStartTag(
    attributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    openedKMLTags.append(self)
  }

  func handleContent(
    elementName: String,
    tagContent: String,
    contentAttributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    if elementName == KMLTagName.styleUrl {
      styleId = tagContent
      styleId?.removeFirst()
    }
  }

  func handleOnEndTag(
    elementName: String,
    tagContent: String,
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    let penultimateContentElement = openedKMLTags.penultimate()
    (penultimateContentElement as? KMLFolderElement)?.featureElements.append(self)
    (penultimateContentElement as? KMLDocumentElement)?.featureElements.append(self)

    updateChildrenStyle()
    openedKMLTags.removeLast()
  }

  func updateStyleWithParentStyleId(styleId: String) {
    if self.styleId == nil {
      self.styleId = styleId
      for featureElement in featureElements {
        featureElement.updateStyleWithParentStyleId(styleId: styleId)
      }
    }
  }

  func updateChildrenStyle() {
    if self.styleId != nil {
      for featureElement in featureElements {
        featureElement.updateStyleWithParentStyleId(styleId: self.styleId!)
      }
    }
  }
}

class KMLMultiGeometryElement: KMLTag {
  private(set) var tagName: String = KMLTagName.multiGeometry
  var styleId: String?
  var geometryElements: [KMLTag] = []

  func handleOnStartTag(
    attributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    openedKMLTags.append(self)
  }

  func handleContent(
    elementName: String,
    tagContent: String,
    contentAttributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    if elementName == KMLTagName.styleUrl {
      styleId = tagContent
      styleId?.removeFirst()
    }
  }

  func handleOnEndTag(
    elementName: String,
    tagContent: String,
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    let penultimateContentElement = openedKMLTags.penultimate()
    (penultimateContentElement as? KMLMultiGeometryElement)?.geometryElements.append(self)
    (penultimateContentElement as? KMLPlacemarkElement)?.geometryElement = self

    updateChildrenStyle()
    openedKMLTags.removeLast()
  }

  func updateStyleWithParentStyleId(styleId: String) {
    if self.styleId == nil {
      self.styleId = styleId
      for geometryElement in geometryElements {
        geometryElement.updateStyleWithParentStyleId(styleId: styleId)
      }
    }
  }

  func updateChildrenStyle() {
    if self.styleId != nil {
      for geometryElement in geometryElements {
        geometryElement.updateStyleWithParentStyleId(styleId: self.styleId!)
      }
    }
  }
}

class KMLOuterBoundaryElement: KMLTag {
  private(set) var tagName: String = KMLTagName.outerBoundary
  private(set) var styleId: String?
  var coordinates: [Coordinate] = []

  func handleOnStartTag(
    attributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    openedKMLTags.append(self)
  }

  func handleOnEndTag(
    elementName: String,
    tagContent: String,
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    let penultimateContentElement = openedKMLTags.penultimate()
    (penultimateContentElement as? KMLPolygonElement)?.coordinates = coordinates

    openedKMLTags.removeLast()
  }
}

class KMLLinearRingElement: KMLTag {
  private(set) var tagName: String = KMLTagName.linearRing
  private(set) var styleId: String?
  var coordinates: [Coordinate] = []

  func handleOnStartTag(
    attributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    openedKMLTags.append(self)
  }

  func handleContent(
    elementName: String,
    tagContent: String,
    contentAttributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    if elementName == KMLTagName.coordinates {
      coordinates = extractCoordinates(stringValue: tagContent)
    }
  }

  func handleOnEndTag(
    elementName: String,
    tagContent: String,
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    let penultimateContentElement = openedKMLTags.penultimate()
    (penultimateContentElement as? KMLOuterBoundaryElement)?.coordinates = coordinates

    openedKMLTags.removeLast()
  }
}

struct Coordinate {
  var longitude: Double
  var latitude: Double
}

class KMLPolygonElement: KMLTag {
  private(set) var tagName: String = KMLTagName.polygon
  var styleId: String?
  var coordinates: [Coordinate] = []

  func handleOnStartTag(
    attributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    openedKMLTags.append(self)
  }

  func handleContent(
    elementName: String,
    tagContent: String,
    contentAttributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    if elementName == KMLTagName.styleUrl {
      styleId = tagContent
      styleId?.removeFirst()
    }
  }

  func handleOnEndTag(
    elementName: String,
    tagContent: String,
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    let penultimateContentElement = openedKMLTags.penultimate()
    (penultimateContentElement as? KMLMultiGeometryElement)?.geometryElements.append(self)
    (penultimateContentElement as? KMLPlacemarkElement)?.geometryElement = self

    openedKMLTags.removeLast()
  }

  func updateStyleWithParentStyleId(styleId: String) {
    if self.styleId == nil {
      self.styleId = styleId
    }
  }
}

class KMLLineElement: KMLTag {
  private(set) var tagName: String = KMLTagName.lineString
  var styleId: String?
  var coordinates: [Coordinate] = []

  func handleOnStartTag(
    attributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    openedKMLTags.append(self)
  }

  func handleContent(
    elementName: String,
    tagContent: String,
    contentAttributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    switch elementName {
    case KMLTagName.coordinates:
      coordinates = extractCoordinates(stringValue: tagContent)
    case KMLTagName.styleUrl:
      styleId = tagContent
      styleId?.removeFirst()
    default:
      break
    }
  }

  func handleOnEndTag(
    elementName: String,
    tagContent: String,
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    let penultimateContentElement = openedKMLTags.penultimate()
    (penultimateContentElement as? KMLMultiGeometryElement)?.geometryElements.append(self)
    (penultimateContentElement as? KMLPlacemarkElement)?.geometryElement = self

    openedKMLTags.removeLast()
  }

  func updateStyleWithParentStyleId(styleId: String) {
    if self.styleId == nil {
      self.styleId = styleId
    }
  }
}

class KMLPointElement: KMLTag {
  private(set) var tagName: String = KMLTagName.point
  var styleId: String?
  var coordinate = Coordinate(longitude: 0, latitude: 0)
  var title: String?

  func handleOnStartTag(
    attributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    openedKMLTags.append(self)
  }

  func handleContent(
    elementName: String,
    tagContent: String,
    contentAttributeDict: [String: String],
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    switch elementName {
    case KMLTagName.coordinates:
      coordinate = extractCoordinates(stringValue: tagContent).first ?? Coordinate(longitude: 0, latitude: 0)
    case KMLTagName.styleUrl:
      styleId = tagContent
      styleId?.removeFirst()
    default:
      break
    }
  }

  func handleOnEndTag(
    elementName: String,
    tagContent: String,
    openedKMLTags: inout [KMLTag],
    kmlStyleElements: inout [String: KMLTag],
    kmlGeometryElements: inout [KMLTag]
  ) {
    let penultimateContentElement = openedKMLTags.penultimate()
    (penultimateContentElement as? KMLMultiGeometryElement)?.geometryElements.append(self)
    (penultimateContentElement as? KMLPlacemarkElement)?.geometryElement = self

    openedKMLTags.removeLast()
  }

  func updateStyleWithParentStyleId(styleId: String) {
    if self.styleId == nil {
      self.styleId = styleId
    }
  }
}

private func extractGeometryElementsAndAppendTitle(kmlGeometry: KMLTag?, kmlGeometryElements: inout [KMLTag], title: String?) {
  if [KMLTagName.multiGeometry, KMLTagName.point, KMLTagName.lineString, KMLTagName.polygon].contains(kmlGeometry?.tagName) {
    let kmlGeometry = kmlGeometry!
    var currentGeometryElements = [kmlGeometry]
    while !currentGeometryElements.isEmpty {
      let currentGeometryElement = currentGeometryElements.first

      if let multiElement = currentGeometryElement as? KMLMultiGeometryElement {
        currentGeometryElements.append(contentsOf: (multiElement).geometryElements)
      } else if let point = currentGeometryElement as? KMLPointElement {
        point.title = title
        kmlGeometryElements.append(point)
      } else {
        kmlGeometryElements.append(currentGeometryElement!)
      }
      currentGeometryElements.removeFirst()
    }
  }
}

private func extractCoordinates(stringValue: String) -> [Coordinate] {
  let commaSeparatedCoordinates = stringValue.split(whereSeparator: \.isWhitespace).map { element in
    element.split(whereSeparator: { separator in
      separator == ","
    })
  }
  return commaSeparatedCoordinates.filter { element in
    element.count >= 2
  }.map { element in
    Coordinate(longitude: Double(element[0]) ?? 0, latitude: Double(element[1]) ?? 0)
  }
}

private func mapStylePairs(kmlStyleElements: inout [String: KMLTag]) {
  kmlStyleElements.values.forEach { kmlStyleElement in
    guard let kmlStyleElement = kmlStyleElement as? KMLStyleMapElement else {
      return
    }
    let childStyleElement = kmlStyleElement.styleElement as? KMLStylePairElement
    if let referencedStyleId = childStyleElement?.referencedStyleId {
      childStyleElement?.styleElement = kmlStyleElements[referencedStyleId]
    }
  }
}

struct KMLTagName {
  static let style = "Style"
  static let cascadingStyle = "gx:CascadingStyle"
  static let styleMap = "StyleMap"
  static let pair = "Pair"
  static let polyStyle = "PolyStyle"
  static let lineStyle = "LineStyle"
  static let iconStyle = "IconStyle"
  static let document = "Document"
  static let folder = "Folder"
  static let placemark = "Placemark"
  static let point = "Point"
  static let multiGeometry = "MultiGeometry"
  static let lineString = "LineString"
  static let linearRing = "LinearRing"
  static let polygon = "Polygon"
  static let outerBoundary = "outerBoundaryIs"
  static let color = "color"
  static let width = "width"
  static let key = "key"
  static let styleUrl = "styleUrl"
  static let coordinates = "coordinates"
  static let name = "name"
  static let kml = "kml"
}
