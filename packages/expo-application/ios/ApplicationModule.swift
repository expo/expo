// Copyright 2018-present 650 Industries. All rights reserved.
import ExpoModulesCore

public class ApplicationModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoApplication")

    Constants {
      let infoPlist = Bundle.main.infoDictionary
      return [
        "applicationName": infoPlist?["CFBundleDisplayName"],
        "applicationId": infoPlist?["CFBundleIdentifier"],
        "nativeApplicationVersion": infoPlist?["CFBundleShortVersionString"],
        "nativeBuildVersion": infoPlist?["CFBundleVersion"],
        "isLiquidGlassAvailable": ApplicationModule.isLiquidGlassAvailable()
      ]
    }

    AsyncFunction("getIosIdForVendorAsync") { () -> String? in
      return UIDevice.current.identifierForVendor?.uuidString
    }

    AsyncFunction("getInstallationTimeAsync") { () -> Double in
      guard let urlToDocumentsFolder = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).last else {
        throw UrlDocumentDirectoryException()
      }

      do {
        let fileAttributes = try FileManager.default.attributesOfItem(atPath: urlToDocumentsFolder.path)
        // Uses required reason API based on the following reason: C617.1
        if let installDate = fileAttributes[FileAttributeKey.creationDate] as? Date {
          return installDate.timeIntervalSince1970 * 1000
        }
        throw DateCastException()
      } catch {
        throw InstallationTimeException()
      }
    }

    AsyncFunction("getApplicationReleaseTypeAsync") { () -> Int in
      let mainProvisioningProfile = EXProvisioningProfile.main()
      return mainProvisioningProfile.appReleaseType().rawValue
    }

    AsyncFunction("getPushNotificationServiceEnvironmentAsync") { () -> String? in
      let mainProvisioningProfile = EXProvisioningProfile.main()
      return mainProvisioningProfile.notificationServiceEnvironment()
    }
  }

  private static func isLiquidGlassAvailable() -> Bool {
    #if compiler(>=6.2)  // Xcode 26
    if #available(iOS 26.0, tvOS 26.0, macOS 26.0, *) {  // iOS 26
      if let infoPlist = Bundle.main.infoDictionary {
        // TODO(@uabx): Add a check for maximum SDK version when apple disables this flag
        if let requiresCompatibility = infoPlist["UIDesignRequiresCompatibility"] as? Bool {
          return !requiresCompatibility  // If the app requires compatibility then it will not use liquid glass
        }
      }
      return true
    }
    #endif
    return false
  }
}
