import ExpoModulesCore

private let authenticationMethodBiometry = "biometry"
private let authenticationMethodDeviceCredentials = "deviceCredentials"

private func normalizeAuthenticationRequirement(_ value: String?) throws -> String? {
  guard let value else {
    return nil
  }
  switch value {
  case authenticationMethodBiometry, authenticationMethodDeviceCredentials:
    return value
  default:
    throw InvalidAuthenticationOptionException(value)
  }
}

internal struct SecureStoreOptions: Record {
  @Field
  var authenticationPrompt: String?

  @Field
  var keychainAccessible: SecureStoreAccessible?

  @Field
  var keychainService: String?

  @Field
  var requireAuthentication: String?

  @Field
  var accessGroup: String?
}

extension SecureStoreOptions {
  func resolvedAuthenticationRequirement() throws -> String? {
    return try normalizeAuthenticationRequirement(requireAuthentication)
  }

  func requiresDeviceCredentials() throws -> Bool {
    return try resolvedAuthenticationRequirement() == authenticationMethodDeviceCredentials
  }

  func serviceSuffix(for authenticationRequirement: String?) -> String {
    guard let authenticationRequirement else {
      return "no-auth"
    }
    return authenticationRequirement == authenticationMethodDeviceCredentials
      ? "auth-deviceCredentials"
      : "auth"
  }
}
