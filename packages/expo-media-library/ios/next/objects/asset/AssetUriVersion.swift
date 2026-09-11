import Photos
import ExpoModulesCore

enum AssetUriVersion: String, Enumerable {
  case CURRENT = "current"
  case ORIGINAL = "original"

  func toPHVideoRequestOptionsVersion() -> PHVideoRequestOptionsVersion {
    switch self {
    case .CURRENT: return .current
    case .ORIGINAL: return .original
    }
  }
}
