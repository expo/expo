struct LocationUpdatesTaskOptions {
  let profile: Profile

  init(profile: Profile) {
    self.profile = profile
  }

  init(_ dictionary: [AnyHashable: Any]?) {
    let rawProfile = dictionary?["profile"] as? String
    profile = rawProfile.flatMap { Profile(rawValue: $0) } ?? .default
  }

  func toDictionary() -> [String: Any] {
    return ["profile": profile.rawValue]
  }
}
