import ExpoModulesCore

// swiftlint:disable redundant_optional_initialization - Initialization with nil is necessary
internal struct VideoSize: Record {
  @Field
  var width: Int? = nil

  @Field
  var height: Int? = nil

  static func from(_ size: CGSize) -> Self {
    return VideoSize(width: Int(size.width), height: Int(size.height))
  }
}
// swiftlint:enable redundant_optional_initialization
