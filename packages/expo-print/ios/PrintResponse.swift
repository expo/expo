import ExpoModulesCore

// Disable swiftlint for redundant_optional_initialization. Optional initialization with nil is necessary for the Record constructors to work.
// swiftlint:disable  redundant_optional_initialization
internal struct FilePrintResult: Record {
  @Field
  var uri: String = ""

  @Field
  var numberOfPages: Int = 0

  @Field
  var base64: String? = nil
}

internal struct PrinterSelectResult: Record {
  @Field
  var url: String? = nil

  @Field
  var name: String? = nil
}
