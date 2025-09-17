import ExpoModulesCore

enum AssetField: String, Enumerable {
  case CREATION_TIME = "creationTime"
  case MODIFICATION_TIME = "modificationTime"
  case MEDIA_TYPE = "mediaType"
  case WIDTH = "width"
  case HEIGHT = "height"
  case DURATION = "duration"

  func photosKey() -> String {
    switch self {
    case .CREATION_TIME:
      return "creationDate"
    case .MODIFICATION_TIME:
      return "modificationDate"
    case .WIDTH:
      return "pixelWidth"
    case .HEIGHT:
      return "pixelHeight"
    case .DURATION:
      return "duration"
    case .MEDIA_TYPE:
      return "mediaType"
    }
  }
}
