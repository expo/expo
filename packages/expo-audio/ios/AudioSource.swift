import ExpoModulesCore

struct AudioSource: Record {
  @Field
  // swiftlint:disable:next redundant_optional_initialization
  var uri: URL? = nil

  @Field
  var headers: [String: String]?
}
