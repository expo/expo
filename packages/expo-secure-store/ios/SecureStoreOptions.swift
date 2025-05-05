import ExpoModulesCore

internal struct SecureStoreOptions: Record {
  @Field
  var authenticationPrompt: String?

  @Field
  var keychainAccessible: SecureStoreAccessible = .whenUnlocked

  @Field
  var keychainService: String?

  @Field
  var requireAuthentication: Bool

  @Field
  var accessGroup: String?
}
