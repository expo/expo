import ExpoModulesCore

// Disable swiftlint for redundant_optional_initialization.
// Optional initialization with nil is necessary for the Record constructors to work.
internal struct DocumentPickerResponse: Record {
  // swiftlint:disable:next redundant_optional_initialization
  @Field var assets: [DocumentInfo]? = nil
  @Field var canceled: Bool = false
}

internal struct DocumentInfo: Record {
  @Field var uri: String = ""
  // swiftlint:disable:next redundant_optional_initialization
  @Field var name: String? = nil
  @Field var size: Int = 0
  // swiftlint:disable:next redundant_optional_initialization
  @Field var mimeType: String? = nil
  @Field var lastModified: Int64 = 0
}
