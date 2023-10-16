// Copyright 2015-present 650 Industries. All rights reserved.
import ExpoModulesCore

class ApplicationModuleProvisioningProfile {
  private var plist: [String: Any]?

  static let mainProvisioningProfile: ApplicationModuleProvisioningProfile = {
    let plist = readProvisioningProfilePlist()
    return ApplicationModuleProvisioningProfile(plist: plist)
  }()

  private init(plist: [String: Any]?) {
    self.plist = plist
  }

  func notificationServiceEnvironment() -> String? {
    guard let plist = plist else {
      return nil
    }

    let entitlements = plist["Entitlements"] as? [String: Any]
    return entitlements?["aps-environment"] as? String
  }

  func appReleaseType() -> String {
    guard let provisioningPath = Bundle.main.path(forResource: "embedded", ofType: "mobileprovision") else {
      #if targetEnvironment(simulator)
      return AppReleaseType.simulator.rawValue
      #else
      return AppReleaseType.appStore.rawValue
      #endif
    }

    guard let mobileProvision = plist else {
      return AppReleaseType.unknown.rawValue
    }

    if let provisionsAllDevices = mobileProvision["ProvisionsAllDevices"] as? Bool, provisionsAllDevices {
      return AppReleaseType.enterprise.rawValue
    }
    if let provisionedDevices = mobileProvision["ProvisionedDevices"] as? [String], !provisionedDevices.isEmpty {
      let entitlements = mobileProvision["Entitlements"] as? [String: Any]
      if let getTaskAllow = entitlements?["get-task-allow"] as? Bool, getTaskAllow {
        return AppReleaseType.dev.rawValue
      }
      return AppReleaseType.adHoc.rawValue
    }
    return AppReleaseType.appStore.rawValue
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
      print("Failed to convert plistString to UTF-8 encoded data object.")
      return nil
    } catch {
      print("Error reading provisioning profile: \(error.localizedDescription)")
      return nil
    }
  }
}

enum AppReleaseType: String, Enumerable {
  case unknown
  case simulator
  case enterprise
  case dev
  case adHoc
  case appStore
}
