import ExpoModulesCore

private let authenticationMethodBiometry = "biometry"
private let authenticationMethodDeviceCredentials = "deviceCredentials"

private func normalizeAuthenticationRequirement(_ value: Either<Bool, String>?) throws -> String? {
  guard let value else {
    return nil
  }

  if let boolValue = value.get() as Bool? {
    return boolValue ? authenticationMethodBiometry : nil
  }

  if let stringValue = value.get() as String? {
    switch stringValue {
    case "", "false":
      return nil
    case "true", authenticationMethodBiometry:
      return authenticationMethodBiometry
    case authenticationMethodDeviceCredentials:
      return authenticationMethodDeviceCredentials
    default:
      throw InvalidAuthenticationOptionException(stringValue)
    }
  }

  throw InvalidAuthenticationOptionException(nil)
}

internal struct SecureStoreOptions: Record {
  @Field
  var authenticationPrompt: String?

  @Field
  var keychainAccessible: SecureStoreAccessible = .whenUnlocked

  @Field
  var keychainService: String?

  @Field
  var requireAuthentication: Either<Bool, String>? = nil

  @Field
  var accessGroup: String?
}

extension SecureStoreOptions {
  func resolvedAuthenticationRequirement() throws -> String? {
    return try normalizeAuthenticationRequirement(requireAuthentication)
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
