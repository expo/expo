struct LocationUpdatesTaskOptions {
  let profile: Profile

  init(profile: Profile) {
    self.profile = profile
  }

  init(_ dictionary: [AnyHashable: Any]?) {
    if let rawProfile = dictionary?["profile"] as? String, let profile = Profile(rawValue: rawProfile) {
      self.profile = profile
    } else {
      profile = .default
    }
  }

  func toDictionary() -> [String: Any] {
    return ["profile": profile.rawValue]
  }
}
