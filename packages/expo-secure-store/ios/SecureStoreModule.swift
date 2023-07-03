import ExpoModulesCore
import LocalAuthentication
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
      "WHEN_UNLOCKED_THIS_DEVICE_ONLY": SecureStoreAccessible.whenPasscodeSetThisDeviceOnly.rawValue
    ])

    AsyncFunction("getValueWithKeyAsync") { (key: String, options: SecureStoreOptions) -> String? in
      guard let key = validate(for: key) else {
        throw InvalidKeyException()
      }

      let data = try searchKeyChain(with: key, options: options)

      guard let data = data else {
        return nil
      }

      return String(data: data, encoding: .utf8)
    }

    AsyncFunction("setValueWithKeyAsync") { (value: String, key: String, options: SecureStoreOptions) -> Bool in
      guard let key = validate(for: key) else {
        throw InvalidKeyException()
      }

      return try set(value: value, with: key, options: options)
    }

    AsyncFunction("deleteValueWithKeyAsync") { (key: String, options: SecureStoreOptions) in
      let searchDictionary = query(with: key, options: options)
      SecItemDelete(searchDictionary as CFDictionary)
    }
  }

  private func set(value: String, with key: String, options: SecureStoreOptions) throws -> Bool {
    var query = query(with: key, options: options)

    let valueData = value.data(using: .utf8)
    query[kSecValueData as String] = valueData

    let accessibility = attributeWith(options: options)

    if !options.requireAuthentication {
      query[kSecAttrAccessible as String] = accessibility
    } else {
      guard let _ = Bundle.main.infoDictionary?["NSFaceIDUsageDescription"] as? String else {
        throw MissingPlistKeyException()
      }
      let accessOptions = SecAccessControlCreateWithFlags(kCFAllocatorDefault, accessibility, SecAccessControlCreateFlags.biometryCurrentSet, nil)
      query[kSecAttrAccessControl as String] = accessOptions
    }

    let status = SecItemAdd(query as CFDictionary, nil)

    switch status {
    case errSecSuccess:
      return true
    case errSecDuplicateItem:
      return try update(value: value, with: key, options: options)
    default:
      throw KeyChainException(status)
    }
  }

  private func update(value: String, with key: String, options: SecureStoreOptions) throws -> Bool {
    var query = query(with: key, options: options)

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

  private func searchKeyChain(with key: String, options: SecureStoreOptions) throws -> Data? {
    var query = query(with: key, options: options)

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

  private func query(with key: String, options: SecureStoreOptions) -> [String: Any] {
    let service = options.keychainService ?? "app"
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
    default:
      return kSecAttrAccessibleWhenUnlocked
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
