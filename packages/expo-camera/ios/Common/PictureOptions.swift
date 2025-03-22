import ExpoModulesCore

struct TakePictureOptions: Record {
  @Field
  var id: Int = 0

  @Field
  var quality: Double = 1

  @Field
  var base64: Bool = false

  @Field
  var exif: Bool = false

  @Field
  var mirror: Bool = false

  @Field
  var fastMode: Bool = false

  @Field
  var imageType: PictureFormat = .jpg

  @Field
  var additionalExif: [String: Any]?

  @Field
  var shutterSound: Bool? = true

  @Field
  var pictureRef: Bool = false
}

struct SavePictureOptions: Record {
  @Field
  var quality: Double = 1

  @Field
  var metadata: [String: Any]? = [:]

  @Field
  var base64: Bool = false
}

enum PictureFormat: String, Enumerable {
  case jpg
  case png

  func toExtension() -> String {
    switch self {
    case .jpg:
      return ".jpg"
    case .png:
      return ".png"
    }
  }

  func mimeType() -> String {
    switch self {
    case .jpg:
      return "image/jpeg"
    case .png:
      return "image/png"
    }
  }
}
