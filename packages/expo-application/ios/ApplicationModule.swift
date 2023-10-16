// Copyright 2018-present 650 Industries. All rights reserved.
import ExpoModulesCore

public class ApplicationModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoApplication")

    Constants([
      "applicationName": Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName"),
      "applicationId": Bundle.main.object(forInfoDictionaryKey: "CFBundleIdentifier"),
      "nativeApplicationVersion": Bundle.main.infoDictionary?["CFBundleShortVersionString"],
      "nativeBuildVersion": Bundle.main.infoDictionary?["CFBundleVersion"]
    ])

    AsyncFunction("getIosIdForVendorAsync") { () -> String? in
      return UIDevice.current.identifierForVendor?.uuidString
    }

    AsyncFunction("getInstallationTimeAsync") { () -> Double in
      guard let urlToDocumentsFolder = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).last else {
        throw UrlDocumentDirectoryException()
      }

      do {
        let fileAttributes = try FileManager.default.attributesOfItem(atPath: urlToDocumentsFolder.path)
        if let installDate = fileAttributes[FileAttributeKey.creationDate] as? Date {
          return installDate.timeIntervalSince1970 * 1000
        }
        throw DateCastException()
      } catch {
        throw InstallationTimeException()
      }
    }

    AsyncFunction("getApplicationReleaseTypeAsync") { () -> Int in
      let mainProvisioningProfile = ApplicationModuleProvisioningProfile.mainProvisioningProfile
      return mainProvisioningProfile.appReleaseType().rawValue
    }

    AsyncFunction("getPushNotificationServiceEnvironmentAsync") { () -> String? in
      let mainProvisioningProfile = ApplicationModuleProvisioningProfile.mainProvisioningProfile
      return mainProvisioningProfile.notificationServiceEnvironment()
    }
  }
}
