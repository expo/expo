import Photos
import ExpoModulesCore

enum MediaTypeNext: String, Enumerable {
  case UNKNOWN = "unknown"
  case IMAGE = "image"
  case AUDIO = "audio"
  case VIDEO = "video"

  func toPHAssetMediaType() -> PHAssetMediaType {
    switch self {
    case .UNKNOWN: return .unknown
    case .IMAGE: return .image
    case .AUDIO: return .audio
    case .VIDEO: return .video
    }
  }

  static func from(_ phAssetMediaType: PHAssetMediaType) -> MediaTypeNext {
    switch phAssetMediaType {
    case .unknown: return .UNKNOWN
    case .image: return .IMAGE
    case .audio: return .AUDIO
    case .video: return .VIDEO
    @unknown default: return .UNKNOWN
    }
  }

  static func from(_ string: String) throws -> MediaTypeNext {
    switch string.lowercased() {
    case "image": return .IMAGE
    case "audio": return .AUDIO
    case "video": return .VIDEO
    case "unknown": return .UNKNOWN
    default: throw MediaTypeFailedToParseString(string)
    }
  }
}
