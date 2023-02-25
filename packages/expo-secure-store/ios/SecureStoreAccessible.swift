import ExpoModulesCore

enum SecureStoreAccessible: Int, Enumerable {
  case afterFirstUnlock
  case afterFirstUnlockThisDeviceOnly
  case always
  case whenPasscodeSetThisDeviceOnly
  case alwaysThisDeviceOnly
  case whenUnlocked
  case whenUnlockedThisDeviceOnly
}
