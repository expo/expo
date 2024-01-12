import ExpoModulesCore

struct AudioSource: Record {
  @Field
  var uri: URL? = nil
  
  @Field
  var headers: [String: String]?
}
