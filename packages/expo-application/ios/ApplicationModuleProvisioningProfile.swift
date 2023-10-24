// Copyright 2015-present 650 Industries. All rights reserved.
import ExpoModulesCore

class ApplicationModuleProvisioningProfile {
  private let plist = readProvisioningProfilePlist()
  static let mainProvisioningProfile = ApplicationModuleProvisioningProfile()

  func notificationServiceEnvironment() -> String? {
    guard let plist = plist else {
      return nil
    }

    let entitlements = plist["Entitlements"] as? [String: Any]
    return entitlements?["aps-environment"] as? String
  }

  func appReleaseType() -> AppReleaseType {
    guard let provisioningPath = Bundle.main.path(forResource: "embedded", ofType: "mobileprovision") else {
      #if targetEnvironment(simulator)
      return .simulator
      #else
      return .appStore
      #endif
    }

    guard let mobileProvision = plist else {
      return .unknown
    }

    if let provisionsAllDevices = mobileProvision["ProvisionsAllDevices"] as? Bool, provisionsAllDevices {
      return .enterprise
    }
    if let provisionedDevices = mobileProvision["ProvisionedDevices"] as? [String], !provisionedDevices.isEmpty {
      let entitlements = mobileProvision["Entitlements"] as? [String: Any]
      if let getTaskAllow = entitlements?["get-task-allow"] as? Bool, getTaskAllow {
        return .dev
      }
      return .adHoc
    }
    return .appStore
  }

  private static func readProvisioningProfilePlist() -> [String: Any]? {
    guard let profilePath = Bundle.main.path(forResource: "embedded", ofType: "mobileprovision") else {
      return nil
    }

    do {
      let profileString = try String(contentsOfFile: profilePath, encoding: .ascii)
      guard let plistStart = profileString.range(of: "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"),
        let plistEnd = profileString.range(of: "</plist>") else {
        return nil
      }

      let plistString = String(profileString[plistStart.lowerBound..<plistEnd.upperBound])
      if let plistData = plistString.data(using: .utf8) {
        return try PropertyListSerialization.propertyList(from: plistData, options: [], format: nil) as? [String: Any]
      }
      log.error("Failed to convert plistString to UTF-8 encoded data object.")
      return nil
    } catch {
      log.error("Error reading provisioning profile: \(error.localizedDescription)")
      return nil
    }
  }
}

enum AppReleaseType: Int, Enumerable {
  case unknown = 0
  case simulator = 1
  case enterprise = 2
  case dev = 3
  case adHoc = 4
  case appStore = 5
}
