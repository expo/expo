// Copyright 2018-present 650 Industries. All rights reserved.
import ExpoModulesCore

public class ApplicationModule: Module {
  let infoPlist = Bundle.main.infoDictionary

  public func definition() -> ModuleDefinition {
    Name("ExpoApplication")

    Constant("applicationName") {
      infoPlist?["CFBundleDisplayName"] as? String
    }

    Constant("applicationId") {
      infoPlist?["CFBundleIdentifier"] as? String
    }

    Constant("nativeApplicationVersion") {
      infoPlist?["CFBundleShortVersionString"] as? String
    }

    Constant("nativeBuildVersion") {
      infoPlist?["CFBundleVersion"] as? String
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
}
