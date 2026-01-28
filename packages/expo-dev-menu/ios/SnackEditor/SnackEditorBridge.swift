// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Foundation

/// Represents a Snack source file
public struct SnackFile {
  let contents: String
  let isAsset: Bool

  init?(from dict: [String: Any]) {
    guard let contents = dict["contents"] as? String,
          let isAsset = dict["isAsset"] as? Bool else {
      return nil
    }
    self.contents = contents
    self.isAsset = isAsset
  }

  func toDictionary() -> [String: Any] {
    return ["contents": contents, "isAsset": isAsset]
  }
}

/// Notification posted when Snack files are updated from the JS side
extension Notification.Name {
  static let snackFilesDidChange = Notification.Name("snackFilesDidChange")
}

/// Bridge module that connects the Snack runtime (JS) to the dev menu (Swift).
/// This module is only active when running in Expo Go with a Snack session.
public class SnackEditorBridge: Module {
  /// Singleton instance for static access from SwiftUI views
  private static var _shared: SnackEditorBridge?
  private static var shared: SnackEditorBridge? { _shared }

  /// Current Snack files received from the JS runtime
  private static var snackFiles: [String: SnackFile] = [:]

  /// Whether we're in an active Snack session
  private static var _isSnackSession: Bool = false

  public func definition() -> ModuleDefinition {
    Name("SnackEditorBridge")

    Events("onFileUpdateRequest")

    OnCreate {
      SnackEditorBridge._shared = self
      print("[SnackEditorBridge] Module created")
    }

    OnDestroy {
      if SnackEditorBridge._shared === self {
        SnackEditorBridge._shared = nil
        SnackEditorBridge._isSnackSession = false
        SnackEditorBridge.snackFiles.removeAll()
      }
    }

    /// Called by the Snack runtime to provide all source files
    AsyncFunction("setSnackFiles") { (files: [String: [String: Any]]) in
      print("[SnackEditorBridge] setSnackFiles called with \(files.count) files")
      SnackEditorBridge._isSnackSession = true
      SnackEditorBridge.snackFiles = files.compactMapValues { SnackFile(from: $0) }
      print("[SnackEditorBridge] Parsed \(SnackEditorBridge.snackFiles.count) files, isSnackSession=\(SnackEditorBridge._isSnackSession)")

      // Notify SwiftUI views that files have changed
      DispatchQueue.main.async {
        NotificationCenter.default.post(name: .snackFilesDidChange, object: nil)
      }
    }

    /// Returns all Snack files as dictionaries
    Function("getSnackFiles") { () -> [String: [String: Any]] in
      return SnackEditorBridge.snackFiles.mapValues { $0.toDictionary() }
    }

    /// Returns whether we're in an active Snack session
    Function("isSnackSession") { () -> Bool in
      return SnackEditorBridge._isSnackSession
    }
  }

  // MARK: - Static API for SwiftUI

  /// Checks if running in Expo Go with an active Snack session
  public static var isSnackSession: Bool {
    // EXKernel only exists in Expo Go, not in expo-dev-client
    let isExpoGo = NSClassFromString("EXKernel") != nil
    return isExpoGo && _isSnackSession
  }

  /// Returns a copy of the current Snack files
  public static func getSnackFiles() -> [String: SnackFile] {
    return snackFiles
  }

  /// Called by SwiftUI when the user saves a file edit
  /// Sends an event to the JS runtime to update the file
  public static func requestFileUpdate(path: String, contents: String) {
    shared?.sendEvent("onFileUpdateRequest", [
      "path": path,
      "contents": contents
    ])
  }
}
