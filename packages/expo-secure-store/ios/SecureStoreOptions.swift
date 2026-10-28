import ExpoModulesCore

internal struct SecureStoreOptions: Record {
  @Field
  var authenticationPrompt: String?

  @Field
  var keychainAccessible: SecureStoreAccessible?

  @Field
  var keychainService: String?

  @Field
  var requireAuthentication: AuthenticationMethod = .none

  @Field
  var accessGroup: String?
}
