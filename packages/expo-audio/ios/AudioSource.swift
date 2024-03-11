import ExpoModulesCore

// swiftlint:disable:next redundant_optional_initialization
struct AudioSource: Record {
  @Field
  var uri: URL? = nil
  
  @Field
  var headers: [String: String]?
}
