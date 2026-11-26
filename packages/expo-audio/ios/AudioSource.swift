import ExpoModulesCore

@Record
struct AudioSource {
  var uri: URL?
  var headers: [String: String]?
  var name: String?
}
