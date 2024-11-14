import ExpoModulesCore
#if !os(tvOS)
import LocalAuthentication
#endif
import Security

public final class SecureStoreModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoSecureStore")

    Constants([
      "AFTER_FIRST_UNLOCK": SecureStoreAccessible.afterFirstUnlock.rawValue,
      "AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY": SecureStoreAccessible.afterFirstUnlockThisDeviceOnly.rawValue,
      "ALWAYS": SecureStoreAccessible.always.rawValue,
      "WHEN_PASSCODE_SET_THIS_DEVICE_ONLY": SecureStoreAccessible.whenPasscodeSetThisDeviceOnly.rawValue,
      "ALWAYS_THIS_DEVICE_ONLY": SecureStoreAccessible.alwaysThisDeviceOnly.rawValue,
      "WHEN_UNLOCKED": SecureStoreAccessible.whenUnlocked.rawValue,
      "WHEN_UNLOCKED_THIS_DEVICE_ONLY": SecureStoreAccessible.whenUnlockedThisDeviceOnly.rawValue
    ])

    AsyncFunction("getValueWithKeyAsync") { (key: String, options: SecureStoreOptions) -> String? in
      return try get(with: key, options: options)
    }

    Function("getValueWithKeySync") { (key: String, options: SecureStoreOptions) -> String? in
      return try get(with: key, options: options)
    }

    AsyncFunction("setValueWithKeyAsync") { (value: String, key: String, options: SecureStoreOptions) -> Bool in
      guard let key = validate(for: key) else {
        throw InvalidKeyException()
      }

      return try set(value: value, with: key, options: options)
    }

    Function("setValueWithKeySync") {(value: String, key: String, options: SecureStoreOptions) -> Bool in
      guard let key = validate(for: key) else {
        throw InvalidKeyException()
      }

      return try set(value: value, with: key, options: options)
    }

    AsyncFunction("deleteValueWithKeyAsync") { (key: String, options: SecureStoreOptions) in
      let noAuthSearchDictionary = query(with: key, options: options, requireAuthentication: false)
      let authSearchDictionary = query(with: key, options: options, requireAuthentication: true)
      let legacySearchDictionary = query(with: key, options: options)

      SecItemDelete(legacySearchDictionary as CFDictionary)
      SecItemDelete(authSearchDictionary as CFDictionary)
      SecItemDelete(noAuthSearchDictionary as CFDictionary)
    }

    Function("canUseBiometricAuthentication") {() -> Bool in
      #if os(tvOS)
      return false
      #else
      let context = LAContext()
      var error: NSError?
      let isBiometricsSupported: Bool = context.canEvaluatePolicy(LAPolicy.deviceOwnerAuthenticationWithBiometrics, error: &error)

      if error != nil {
        return false
      }
      return isBiometricsSupported
      #endif
    }
  }

  private func get(with key: String, options: SecureStoreOptions) throws -> String? {
    guard let key = validate(for: key) else {
      throw InvalidKeyException()
    }

    if let unauthenticatedItem = try searchKeyChain(with: key, options: options, requireAuthentication: false) {
      return String(data: unauthenticatedItem, encoding: .utf8)
    }

    if let authenticatedItem = try searchKeyChain(with: key, options: options, requireAuthentication: true) {
      return String(data: authenticatedItem, encoding: .utf8)
    }

    if let legacyItem = try searchKeyChain(with: key, options: options) {
      return String(data: legacyItem, encoding: .utf8)
    }

    return nil
  }

  private func set(value: String, with key: String, options: SecureStoreOptions) throws -> Bool {
    var setItemQuery = query(with: key, options: options, requireAuthentication: options.requireAuthentication)

    let valueData = value.data(using: .utf8)
    setItemQuery[kSecValueData as String] = valueData

    let accessibility = attributeWith(options: options)

    if !options.requireAuthentication {
      setItemQuery[kSecAttrAccessible as String] = accessibility
    } else {
      guard let _ = Bundle.main.infoDictionary?["NSFaceIDUsageDescription"] as? String else {
        throw MissingPlistKeyException()
      }

      var error: Unmanaged<CFError>? = nil
      guard let accessOptions = SecAccessControlCreateWithFlags(kCFAllocatorDefault, accessibility, .biometryCurrentSet, &error) else {
        let errorCode = error.map { CFErrorGetCode($0.takeRetainedValue()) }
        throw SecAccessControlError(errorCode)
      }
      setItemQuery[kSecAttrAccessControl as String] = accessOptions
    }

    let status = SecItemAdd(setItemQuery as CFDictionary, nil)

    switch status {
    case errSecSuccess:
      // On success we want to remove the other key alias and legacy key (if they exist) to avoid conflicts during reads
      SecItemDelete(query(with: key, options: options) as CFDictionary)
      SecItemDelete(query(with: key, options: options, requireAuthentication: !options.requireAuthentication) as CFDictionary)
      return true
    case errSecDuplicateItem:
      return try update(value: value, with: key, options: options)
    default:
      throw KeyChainException(status)
    }
  }

  private func update(value: String, with key: String, options: SecureStoreOptions) throws -> Bool {
    var query = query(with: key, options: options, requireAuthentication: options.requireAuthentication)

    let valueData = value.data(using: .utf8)
    let updateDictionary = [kSecValueData as String: valueData]

    if let authPrompt = options.authenticationPrompt {
      query[kSecUseOperationPrompt as String] = authPrompt
    }

    let status = SecItemUpdate(query as CFDictionary, updateDictionary as CFDictionary)

    if status == errSecSuccess {
      return true
    } else {
      throw KeyChainException(status)
    }
  }

  private func searchKeyChain(with key: String, options: SecureStoreOptions, requireAuthentication: Bool? = nil) throws -> Data? {
    var query = query(with: key, options: options, requireAuthentication: requireAuthentication)

    query[kSecMatchLimit as String] = kSecMatchLimitOne
    query[kSecReturnData as String] = kCFBooleanTrue

    if let authPrompt = options.authenticationPrompt {
      query[kSecUseOperationPrompt as String] = authPrompt
    }

    var item: CFTypeRef?
    let status = SecItemCopyMatching(query as CFDictionary, &item)

    switch status {
    case errSecSuccess:
      guard let item = item as? Data else {
        return nil
      }
      return item
    case errSecItemNotFound:
      return nil
    default:
      throw KeyChainException(status)
    }
  }

  private func query(with key: String, options: SecureStoreOptions, requireAuthentication: Bool? = nil) -> [String: Any] {
    var service = options.keychainService ?? "app"
    if let requireAuthentication {
      service.append(":\(requireAuthentication ? "auth" : "no-auth")")
    }

    let encodedKey = Data(key.utf8)

    return [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: service,
      kSecAttrGeneric as String: encodedKey,
      kSecAttrAccount as String: encodedKey
    ]
  }

  private func attributeWith(options: SecureStoreOptions) -> CFString {
    switch options.keychainAccessible {
    case .afterFirstUnlock:
      return kSecAttrAccessibleAfterFirstUnlock
    case .afterFirstUnlockThisDeviceOnly:
      return kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
    case .always:
      return kSecAttrAccessibleAlways
    case .whenPasscodeSetThisDeviceOnly:
      return kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly
    case .whenUnlocked:
      return kSecAttrAccessibleWhenUnlocked
    case .alwaysThisDeviceOnly:
      return kSecAttrAccessibleAlwaysThisDeviceOnly
    case .whenUnlockedThisDeviceOnly:
      return kSecAttrAccessibleWhenUnlockedThisDeviceOnly
    }
  }

  private func validate(for key: String) -> String? {
    let trimmedKey = key.trimmingCharacters(in: .whitespaces)
    if trimmedKey.isEmpty {
      return nil
    }
    return key
  }
}
