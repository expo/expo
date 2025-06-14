import ExpoModulesCore

// Disable swiftlint for redundant_optional_initialization. Optional initialization with nil is necessary for the Record constructors to work.
// swiftlint:disable  redundant_optional_initialization
internal struct DocumentPickerResponse: Record {
  @Field var assets: [DocumentInfo]? = nil
  @Field var canceled: Bool = false
}

internal struct DocumentInfo: Record {
  @Field var uri: String = ""
  @Field var name: String? = nil
  @Field var size: Int = 0
  @Field var mimeType: String? = nil
  @Field var lastModified: Int64 = 0
}
