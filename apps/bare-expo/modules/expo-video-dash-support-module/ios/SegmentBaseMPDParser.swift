import Foundation

final class SegmentBaseMPDParser: NSObject, XMLParserDelegate {
  private struct AdaptationSetContext {
    var contentType: String?
    var mimeType: String?
    var language: String?
    var role: String?
    var channels: String?
  }

  private struct RepresentationContext {
    var id: String
    var bandwidth: Int
    var codecs: String
    var mimeType: String?
    var width: Int?
    var height: Int?
    var baseURL: String = ""
    var initializationRange: String?
    var indexRange: String?
  }

  private let manifestBaseURL: URL

  private var duration: Double = 0
  private var currentAdaptationSet = AdaptationSetContext()
  private var currentRepresentation: RepresentationContext?
  private var currentCharacters = ""

  private var videoRepresentations: [SegmentBaseRepresentation] = []
  private var audioRepresentations: [SegmentBaseRepresentation] = []
  private var subtitleRepresentations: [SegmentBaseSubtitleRepresentation] = []

  init(manifestURL: URL) {
    self.manifestBaseURL = manifestURL.deletingLastPathComponent()
  }

  func parse(data: Data) -> SegmentBaseDASHManifest? {
    let parser = XMLParser(data: data)
    parser.shouldResolveExternalEntities = false
    parser.delegate = self
    guard parser.parse() else {
      return nil
    }

    return SegmentBaseDASHManifest(
      duration: duration,
      videoRepresentations: videoRepresentations,
      audioRepresentations: audioRepresentations,
      subtitleRepresentations: subtitleRepresentations
    )
  }

  func parser(
    _ parser: XMLParser,
    didStartElement elementName: String,
    namespaceURI: String?,
    qualifiedName qName: String?,
    attributes attributeDict: [String: String] = [:]
  ) {
    currentCharacters = ""

    switch elementName {
    case "MPD":
      if let durationValue = attributeDict["mediaPresentationDuration"] {
        duration = (try? parseDuration(durationValue)) ?? 0
      }
    case "AdaptationSet":
      currentAdaptationSet = AdaptationSetContext(
        contentType: attributeDict["contentType"],
        mimeType: attributeDict["mimeType"],
        language: attributeDict["lang"],
        role: nil,
        channels: nil
      )
    case "Role":
      currentAdaptationSet.role = attributeDict["value"]
    case "AudioChannelConfiguration":
      currentAdaptationSet.channels = attributeDict["value"]
    case "Representation":
      currentRepresentation = RepresentationContext(
        id: attributeDict["id"] ?? UUID().uuidString,
        bandwidth: Int(attributeDict["bandwidth"] ?? "0") ?? 0,
        codecs: attributeDict["codecs"] ?? "",
        mimeType: attributeDict["mimeType"],
        width: attributeDict["width"].flatMap(Int.init),
        height: attributeDict["height"].flatMap(Int.init)
      )
    case "SegmentBase":
      currentRepresentation?.indexRange = attributeDict["indexRange"]
    case "Initialization":
      currentRepresentation?.initializationRange = attributeDict["range"]
    default:
      break
    }
  }

  func parser(_ parser: XMLParser, foundCharacters string: String) {
    currentCharacters += string
  }

  func parser(_ parser: XMLParser, didEndElement elementName: String, namespaceURI: String?, qualifiedName qName: String?) {
    switch elementName {
    case "BaseURL":
      currentRepresentation?.baseURL = currentCharacters.trimmingCharacters(in: .whitespacesAndNewlines)
    case "Representation":
      guard let representation = currentRepresentation else {
        return
      }
      currentRepresentation = nil

      let resolvedURL = try? resolveURL(from: representation.baseURL)
      guard let resolvedURL else {
        return
      }

      let mimeType = representation.mimeType ?? currentAdaptationSet.mimeType ?? currentAdaptationSet.contentType ?? ""
      let contentType = currentAdaptationSet.contentType ?? mimeType
      if mimeType.contains("text/vtt") || contentType == "text" {
        subtitleRepresentations.append(
          SegmentBaseSubtitleRepresentation(
            id: representation.id,
            language: currentAdaptationSet.language,
            url: resolvedURL
          )
        )
        return
      }

      guard
        let initializationRange = representation.initializationRange.flatMap(parseRange),
        let indexRange = representation.indexRange.flatMap(parseRange)
      else {
        return
      }

      let parsedRepresentation = SegmentBaseRepresentation(
        id: representation.id,
        bandwidth: representation.bandwidth,
        codecs: representation.codecs,
        mimeType: mimeType,
        width: representation.width,
        height: representation.height,
        language: currentAdaptationSet.language,
        channels: currentAdaptationSet.channels,
        url: resolvedURL,
        initializationRange: initializationRange,
        indexRange: indexRange
      )

      if mimeType.contains("audio") || contentType == "audio" {
        audioRepresentations.append(parsedRepresentation)
      } else {
        videoRepresentations.append(parsedRepresentation)
      }
    case "AdaptationSet":
      currentAdaptationSet = AdaptationSetContext()
    default:
      break
    }
  }

  private func resolveURL(from baseURLString: String) throws -> URL {
    let trimmed = baseURLString.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else {
      throw SegmentBaseDASHError.invalidBaseURL(baseURLString)
    }

    let normalized = trimmed.removingPercentEncoding ?? trimmed
    if let absolute = URL(string: normalized), absolute.scheme != nil {
      return absolute
    }
    if let relative = URL(string: normalized, relativeTo: manifestBaseURL)?.absoluteURL {
      return relative
    }
    if let encodedRelative = URL(string: trimmed, relativeTo: manifestBaseURL)?.absoluteURL {
      return encodedRelative
    }
    throw SegmentBaseDASHError.invalidBaseURL(baseURLString)
  }

  private func parseRange(_ value: String) -> ByteRange? {
    let parts = value.split(separator: "-")
    guard parts.count == 2, let start = Int64(parts[0]), let end = Int64(parts[1]), end >= start else {
      return nil
    }
    return ByteRange(start: start, length: end - start + 1)
  }

  private func parseDuration(_ value: String) throws -> Double {
    guard value.hasPrefix("PT"), value.hasSuffix("S") else {
      throw SegmentBaseDASHError.invalidDuration(value)
    }
    let secondsString = String(value.dropFirst(2).dropLast())
    guard let seconds = Double(secondsString) else {
      throw SegmentBaseDASHError.invalidDuration(value)
    }
    return seconds
  }
}
