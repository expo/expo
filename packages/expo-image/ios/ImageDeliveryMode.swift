import Photos
import ExpoModulesCore

/**
 Controls how the Photos framework delivers image data for Photo Library assets
 (sources with the `ph://` scheme).
 */
enum ImageDeliveryMode: String, Enumerable {
  case highQuality
  case opportunistic

  func toPHImageRequestOptionsDeliveryMode() -> PHImageRequestOptionsDeliveryMode {
    switch self {
    case .highQuality:
      return .highQualityFormat
    case .opportunistic:
      return .opportunistic
    }
  }
}
