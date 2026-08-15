import Foundation

struct SegmentBaseDASHManifest {
  let duration: Double
  let videoRepresentations: [SegmentBaseRepresentation]
  let audioRepresentations: [SegmentBaseRepresentation]
  let subtitleRepresentations: [SegmentBaseSubtitleRepresentation]
}

struct SegmentBaseRepresentation {
  let id: String
  let bandwidth: Int
  let codecs: String
  let mimeType: String
  let width: Int?
  let height: Int?
  let language: String?
  let channels: String?
  let url: URL
  let initializationRange: ByteRange
  let indexRange: ByteRange
}

struct SegmentBaseSubtitleRepresentation {
  let id: String
  let language: String?
  let url: URL
}

struct ByteRange {
  let start: Int64
  let length: Int64
}

struct SegmentByteRange {
  let duration: Double
  let byteRange: ByteRange
}

enum SegmentBaseDASHError: LocalizedError {
  case invalidManifest
  case invalidDuration(String)
  case invalidRange(String)
  case invalidBaseURL(String)
  case missingSegmentBase(String)
  case invalidIndexData
  case hierarchicalSidxUnsupported

  var errorDescription: String? {
    switch self {
    case .invalidManifest:
      return "Failed to parse the SegmentBase DASH manifest"
    case .invalidDuration(let value):
      return "Unsupported mediaPresentationDuration: \(value)"
    case .invalidRange(let value):
      return "Invalid byte range: \(value)"
    case .invalidBaseURL(let value):
      return "Invalid BaseURL: \(value)"
    case .missingSegmentBase(let id):
      return "Representation \(id) is missing SegmentBase metadata"
    case .invalidIndexData:
      return "Failed to parse the DASH sidx index"
    case .hierarchicalSidxUnsupported:
      return "Hierarchical DASH sidx indexes are not supported"
    }
  }
}
