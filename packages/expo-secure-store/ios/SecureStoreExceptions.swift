import ExpoModulesCore

internal class InvalidKeyException: Exception {
  override var reason: String {
    "Invalid key"
  }
}

internal class MissingPlistKeyException: Exception {
  override var reason: String {
    "You must set `NSFaceIDUsageDescription` in your Info.plist file to use the `requireAuthentication` option"
  }
}

internal class KeyChainException: GenericException<OSStatus> {
  override var reason: String {
    switch param {
    case errSecUnimplemented:
      return "Function or operation not implemented."

    case errSecIO:
      return "I/O error."

    case errSecOpWr:
      return "File already open with with write permission."

    case errSecParam:
      return "One or more parameters passed to a function where not valid."

    case errSecAllocate:
      return "Failed to allocate memory."

    case errSecUserCanceled:
      return "User canceled the operation."

    case errSecBadReq:
      return "Bad parameter or invalid state for operation."

    case errSecNotAvailable:
      return "No keychain is available. You may need to restart your computer."

    case errSecDuplicateItem:
      return "The specified item already exists in the keychain."

    case errSecItemNotFound:
      return "The specified item could not be found in the keychain."

    case errSecInteractionNotAllowed:
      return "User interaction is not allowed."

    case errSecDecode:
      return "Unable to decode the provided data."

    case errSecAuthFailed:
      return "Authentication failed. Provided passphrase/PIN is incorrect or there is no user authentication method configured for this device."

    default:
      return "Unknown Keychain Error."
    }
  }
}
