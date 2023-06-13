import ExpoModulesCore
import SDWebImage

enum ImagePriority: String, Enumerable {
  case low
  case normal
  case high

  /**
   Maps the priority to `SDWebImageOptions` which is a bitmask thus has only low and high priority options.
   */
  func toSDWebImageOptions() -> SDWebImageOptions? {
    switch self {
    case .low:
      return .lowPriority
    case .high:
      return .highPriority
    default:
      return nil
    }
  }
}
