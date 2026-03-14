import ExpoModulesCore

internal struct SecureStoreOptions: Record {
  @Field
  var authenticationPrompt: String?

  @Field
  var keychainAccessible: SecureStoreAccessible = .whenUnlocked

  @Field
  var keychainService: String?

  @Field
  var requireAuthentication: String? = nil

  @Field
  var accessGroup: String?
}

extension SecureStoreOptions {
  var isAuthenticationRequired: Bool {
    return requireAuthentication != nil
  }

  var isUserPresenceRequired: Bool {
    return requireAuthentication == "userPresence"
  }
}
