// Copyright 2025-present 650 Industries. All rights reserved.

internal import ExpoModulesCore
import Foundation

/// Inline module that reports which Observe data is stored on the device, for the consent tests.
/// It only reads, so it never creates the installation ID or the database.
class StorageInspector: Module {
  public func definition() -> ModuleDefinition {
    Function("inspect") { () -> [String: Any] in
      let fileManager = FileManager.default
      let documents = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
      let caches = fileManager.urls(for: .cachesDirectory, in: .userDomainMask)[0]
      let pendingErrors = caches.appendingPathComponent("ExpoAppMetrics/pending-errors")
      let preferences = fileManager.urls(for: .libraryDirectory, in: .userDomainMask)[0].appendingPathComponent("Preferences")
      func settingsFileExists(_ suiteName: String) -> Bool {
        return fileManager.fileExists(atPath: preferences.appendingPathComponent("\(suiteName).plist").path)
      }
      func settingsKeys(_ suiteName: String) -> String {
        let keys = UserDefaults.standard.persistentDomain(forName: suiteName)?.keys.sorted() ?? []
        return keys.isEmpty ? "none" : keys.joined(separator: ",")
      }
      return [
        "databaseExists": fileManager.fileExists(atPath: documents.appendingPathComponent("ExpoAppMetrics/metrics.db").path),
        "legacyStoreExists": fileManager.fileExists(atPath: documents.appendingPathComponent("ExpoAppMetrics/metrics.json").path),
        // iOS has no crash files: MetricKit delivers crashes on the next launch.
        "crashFileCount": 0,
        "pendingErrorFileCount": (try? fileManager.contentsOfDirectory(atPath: pendingErrors.path).count) ?? 0,
        "installationIdStored": UserDefaults.standard.string(forKey: "expo.eas-client-id") != nil,
        "appMetricsSettingsKeys": settingsKeys("dev.expo.app-metrics"),
        "appMetricsSettingsFileExists": settingsFileExists("dev.expo.app-metrics"),
        "observeSettingsKeys": settingsKeys("dev.expo.observe"),
        "observeSettingsFileExists": settingsFileExists("dev.expo.observe"),
      ]
    }
  }
}
