import ExpoModulesCore

struct AudioSource: Record {
  @Field
  // swiftlint:disable:next redundant_optional_initialization
  var uri: URL? = nil

  @Field
  var headers: [String: String]?

  @Field
  // The MIME type of the audio file. Use this when the file extension
  // is missing or incorrect. Example: "audio/ogg", "audio/mpeg".
  // This uses AVURLAssetOutOfBandMIMETypeKey on iOS.
  var mimeType: String?
}
