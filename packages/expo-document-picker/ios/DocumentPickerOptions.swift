import ExpoModulesCore
import MobileCoreServices

struct DocumentPickerOptions: Record {
  @Field
  var copyToCacheDirectory: Bool

  @Field
  var type: [MimeType]

  @Field
  var multiple: Bool
}

internal enum MimeType: String, Enumerable {
  case item = "*/*"
  case image = "image/*"
  case video = "video/*"
  case audio = "audio/*"
  case text = "text/*"

  @available(iOS 14.0, *)
  func toUTType() -> UTType? {
    switch self {
    case .item:
      return UTType.item
    case .image:
      return UTType.image
    case .video:
      return UTType.video
    case .audio:
      return UTType.audio
    case .text:
      return UTType.text
    default:
      return UTType(mimeType: self.rawValue)
    }
  }

  func toUTI() -> String {
    var uti: CFString

    switch self {
    case .item:
      uti = kUTTypeItem
    case .image:
      uti = kUTTypeImage
    case .video:
      uti = kUTTypeVideo
    case .audio:
      uti = kUTTypeAudio
    case .text:
      uti = kUTTypeText
    default:
      if let ref = UTTypeCreatePreferredIdentifierForTag(
         kUTTagClassMIMEType,
         self.rawValue as CFString,
         nil
       )?.takeRetainedValue() {
         uti = ref
       } else {
         uti = kUTTypeItem
       }
    }

    return uti as String
  }
}
