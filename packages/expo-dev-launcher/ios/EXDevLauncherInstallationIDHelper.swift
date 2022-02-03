// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

let DEV_LAUNCHER_INSTALLATION_ID_FILENAME = "expo-dev-launcher-installation-id.txt"

@objc
public class EXDevLauncherInstallationIDHelper: NSObject {
  @objc
  public func getOrCreateInstallationID() -> String {
    let savedID = getInstallationID()
    if savedID != nil {
      return savedID!
    }

    let newID = NSUUID().uuidString
    setInstallationID(newID)
    return newID
  }

  private var installationID: String?

  private func getInstallationID() -> String? {
    if installationID != nil {
      return installationID
    }

    let installationIDFileURL = getInstallationIDFileURL()
    if FileManager.default.fileExists(atPath: installationIDFileURL.path) {
      do {
        installationID = try String(contentsOf: installationIDFileURL, encoding: .utf8)
      } catch let error {
        NSLog("Failed to read stored installation ID: %@", error.localizedDescription)
      }
    }

    // return either persisted value or nil
    return installationID
  }

  private func setInstallationID(_ newID: String) {
    // store in memory, in case there's a problem writing to persistent storage
    // then at least subsequent calls during this session will return the same value
    installationID = newID

    var installationIDFileURL = getInstallationIDFileURL()

    do {
      try newID.write(to: installationIDFileURL, atomically: true, encoding: .utf8)

      var resourceValues = URLResourceValues()
      resourceValues.isExcludedFromBackup = true
      try installationIDFileURL.setResourceValues(resourceValues)
    } catch let error {
      NSLog("Failed to write or set resource values to installation ID file: %@", error.localizedDescription)
    }
  }

  private func getInstallationIDFileURL() -> URL {
    let applicationSupportURL = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
    if !FileManager.default.fileExists(atPath: applicationSupportURL.path) {
      do {
        try FileManager.default.createDirectory(at: applicationSupportURL, withIntermediateDirectories: true, attributes: nil)
      } catch let error {
        NSLog("Failed to create application support directory: %@", error.localizedDescription)
      }
    }
    return applicationSupportURL.appendingPathComponent(DEV_LAUNCHER_INSTALLATION_ID_FILENAME)
  }
}
