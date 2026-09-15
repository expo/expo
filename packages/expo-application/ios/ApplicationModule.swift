// Copyright 2018-present 650 Industries. All rights reserved.
import ExpoModulesCore

@ExpoModule("ExpoApplication")
public class ApplicationModule: Module {
  let infoPlist = Bundle.main.infoDictionary

  @JS
  var applicationName: String? {
    infoPlist?["CFBundleDisplayName"] as? String
  }

  @JS
  var applicationId: String? {
    infoPlist?["CFBundleIdentifier"] as? String
  }

  @JS
  var nativeApplicationVersion: String? {
    infoPlist?["CFBundleShortVersionString"] as? String
  }

  @JS
  var nativeBuildVersion: String? {
    infoPlist?["CFBundleVersion"] as? String
  }

  // `UIDevice` is main-actor isolated.
  @JS
  @MainActor
  func getIosIdForVendorAsync() async -> String? {
    return UIDevice.current.identifierForVendor?.uuidString
  }

  // The functions below read from the file system, so `.concurrent` runs them off the JS thread.
  @JS(.concurrent)
  func getInstallationTimeAsync() async throws -> Double {
    guard let urlToDocumentsFolder = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).last
    else {
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

  @JS(.concurrent)
  func getApplicationReleaseTypeAsync() async -> Int {
    let mainProvisioningProfile = EXProvisioningProfile.main()
    return mainProvisioningProfile.appReleaseType().rawValue
  }

  @JS(.concurrent)
  func getPushNotificationServiceEnvironmentAsync() async -> String? {
    let mainProvisioningProfile = EXProvisioningProfile.main()
    return mainProvisioningProfile.notificationServiceEnvironment()
  }
}
