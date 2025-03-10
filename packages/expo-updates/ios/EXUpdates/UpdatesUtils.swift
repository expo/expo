//  Copyright © 2019 650 Industries. All rights reserved.

// swiftlint:disable force_unwrapping

import Foundation
import SystemConfiguration
import CommonCrypto
import Reachability
import ExpoModulesCore

internal extension Array where Element: Equatable {
  mutating func remove(_ element: Element) {
    if let index = firstIndex(of: element) {
      remove(at: index)
    }
  }
}

@objc(EXUpdatesUtils)
@objcMembers
public final class UpdatesUtils: NSObject {
  private static let EXUpdatesUtilsErrorDomain = "EXUpdatesUtils"

  // MARK: - Public methods

  // Refactored to a common method used by both UpdatesUtils and ErrorRecovery
  public static func updatesApplicationDocumentsDirectory() -> URL {
    let fileManager = FileManager.default
#if os(tvOS)
    let applicationDocumentsDirectory = fileManager.urls(for: .cachesDirectory, in: .userDomainMask).last!
#else
    let applicationDocumentsDirectory = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).last!
#endif
    return applicationDocumentsDirectory
  }

  public static func initializeUpdatesDirectory() throws -> URL {
    let fileManager = FileManager.default
    let applicationDocumentsDirectory = UpdatesUtils.updatesApplicationDocumentsDirectory()
    let updatesDirectory = applicationDocumentsDirectory.appendingPathComponent(".expo-internal")
    let updatesDirectoryPath = updatesDirectory.path

    var isDir = ObjCBool(false)
    let exists = fileManager.fileExists(atPath: updatesDirectoryPath, isDirectory: &isDir)

    if exists {
      if !isDir.boolValue {
        throw NSError(
          domain: EXUpdatesUtilsErrorDomain,
          code: 1005,
          userInfo: [
            NSLocalizedDescriptionKey: "Failed to create the Updates Directory; a file already exists with the required directory name"
          ]
        )
      }
    } else {
      try fileManager.createDirectory(atPath: updatesDirectoryPath, withIntermediateDirectories: true)
    }
    return updatesDirectory
  }

  // MARK: - Internal methods

  public static func defaultNativeStateMachineContextJson() -> [String: Any?] {
    return UpdatesStateContext().json
  }

  internal static func shouldCheckForUpdate(withConfig config: UpdatesConfig) -> Bool {
    func isConnectedToWifi() -> Bool {
      do {
        return try Reachability().connection == .wifi
      } catch {
        return false
      }
    }

    switch config.checkOnLaunch {
    case .Always:
      return true
    case .WifiOnly:
      return isConnectedToWifi()
    case .Never:
      return false
    case .ErrorRecoveryOnly:
      // check will happen later on if there's an error
      return false
    }
  }

  internal static func embeddedAssetsMap(withConfig config: UpdatesConfig, database: UpdatesDatabase, logger: UpdatesLogger) -> [String: String] {
    var assetFilesMap: [String: String] = [:]
    let embeddedManifest: Update? = EmbeddedAppLoader.embeddedManifest(withConfig: config, database: database)
    let embeddedAssets = embeddedManifest?.assets() ?? []

    // Prepopulate with embedded assets
    for asset in embeddedAssets {
      if let assetKey = asset.key,
        !asset.isLaunchAsset {
        let absolutePath = path(forBundledAsset: asset)
        let message = "AppLauncherWithDatabase: embedded asset key = \(asset.key ?? ""), main bundle filename = \(asset.mainBundleFilename ?? ""), path = \(absolutePath ?? "")"
        logger.debug(message: message)
        if let absolutePath = absolutePath {
          assetFilesMap[assetKey] = URL(fileURLWithPath: absolutePath).absoluteString
        }
      }
    }

    return assetFilesMap
  }

  internal static func url(forBundledAsset asset: UpdateAsset) -> URL? {
    guard let mainBundleDir = asset.mainBundleDir else {
      return Bundle.main.url(forResource: asset.mainBundleFilename, withExtension: asset.type)
    }
    return Bundle.main.url(forResource: asset.mainBundleFilename, withExtension: asset.type, subdirectory: mainBundleDir)
  }

  internal static func path(forBundledAsset asset: UpdateAsset) -> String? {
    guard let mainBundleDir = asset.mainBundleDir else {
      return Bundle.main.path(forResource: asset.mainBundleFilename, ofType: asset.type)
    }
    return Bundle.main.path(forResource: asset.mainBundleFilename, ofType: asset.type, inDirectory: mainBundleDir)
  }

  /**
   Purges entries in the expo-updates log file that are older than 1 day
   */
  internal static func purgeUpdatesLogsOlderThanOneDay(logger: UpdatesLogger) {
    UpdatesLogReader().purgeLogEntries { error in
      if let error = error {
        logger.warn(message: "UpdatesUtils: error in purgeOldUpdatesLogs: \(error.localizedDescription)")
      }
    }
  }

  public static func isNativeDebuggingEnabled() -> Bool {
#if EX_UPDATES_NATIVE_DEBUG
    return true
#else
    return false
#endif
  }

  internal static func isUsingCustomInitialization() -> Bool {
#if EX_UPDATES_CUSTOM_INIT
    return true
#else
    return false
#endif
  }

  internal static func runBlockOnMainThread(_ block: @escaping () -> Void) {
    if Thread.isMainThread {
      block()
    } else {
      DispatchQueue.main.async {
        block()
      }
    }
  }

  internal static func hexEncodedSHA256WithData(_ data: Data) -> String {
    var digest = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
    data.withUnsafeBytes { bytes in
      _ = CC_SHA256(bytes.baseAddress, CC_LONG(data.count), &digest)
    }
    return digest.reduce("") { $0 + String(format: "%02x", $1) }
  }

  internal static func base64UrlEncodedSHA256WithData(_ data: Data) -> String {
    var digest = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
    data.withUnsafeBytes { bytes in
      _ = CC_SHA256(bytes.baseAddress, CC_LONG(data.count), &digest)
    }
    let base64EncodedDigest = Data(digest).base64EncodedString()

    // ref. https://datatracker.ietf.org/doc/html/rfc4648#section-5
    return base64EncodedDigest
      .trimmingCharacters(in: CharacterSet(charactersIn: "=")) // remove extra padding
      .replacingOccurrences(of: "+", with: "-") // replace "+" character w/ "-"
      .replacingOccurrences(of: "/", with: "_") // replace "/" character w/ "_"
  }
}

// swiftlint:enable force_unwrapping
