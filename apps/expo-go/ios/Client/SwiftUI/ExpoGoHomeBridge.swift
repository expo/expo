// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import UIKit
import EXDevMenu

@objc public class ExpoGoHomeBridge: NSObject {
  @objc public static let shared = ExpoGoHomeBridge()
  private weak var homeViewModel: HomeViewModel?

  private override init() {
    super.init()
  }

  func setHomeViewModel(_ viewModel: HomeViewModel) {
    self.homeViewModel = viewModel
  }

  /// Opens an app with optional snack session setup.
  /// - Parameters:
  ///   - url: The URL to open
  ///   - snackParams: Optional snack session parameters. If provided, sets up a snack session before opening.
  ///     - channel: (required) The snack channel ID
  ///     - snackId: The snack identifier for fetching from API (e.g., @username/snackname)
  ///     - code: Code files to host directly (for lessons/playgrounds)
  ///     - dependencies: Dependencies for the snack
  ///     - isStaging: Whether to use staging Snackpub
  ///     - isLesson: Whether this is a lesson session
  ///     - lessonId: The lesson ID
  ///     - lessonDescription: The lesson description
  ///     - name: Display name for the snack
  ///   - completion: Callback with success/failure
  @objc public func openApp(url: String, snackParams: NSDictionary?, completion: @escaping (Bool, String?) -> Void) {
    guard let appUrl = URL(string: url) else {
      completion(false, "Invalid URL: \(url)")
      return
    }

    Task { @MainActor in
      // 1. Clear session before any setup.
      // This ensures the FAB sees cleared state when the app starts loading.
      SnackEditingSession.shared.clearSession()

      // 2. If snack params provided, set up the session
      if let params = snackParams,
         let channel = params["channel"] as? String {
        let isStaging = params["isStaging"] as? Bool ?? false
        let isLesson = params["isLesson"] as? Bool ?? false
        let lessonId = params["lessonId"] as? Int
        let lessonDescription = params["lessonDescription"] as? String
        let name = params["name"] as? String

        if let code = params["code"] as? [String: [String: Any]] {
          // Lesson/playground: code provided directly
          var snackFiles: [String: SnackSessionClient.SnackFile] = [:]
          for (path, fileData) in code {
            let contents = fileData["contents"] as? String ?? ""
            let isAsset = fileData["type"] as? String == "ASSET"
            snackFiles[path] = SnackSessionClient.SnackFile(path: path, contents: contents, isAsset: isAsset)
          }

          let dependencies = params["dependencies"] as? [String: [String: Any]] ?? [:]
          let snackId = params["snackId"] as? String ?? "new"

          await SnackEditingSession.shared.setupSessionWithCode(
            snackId: snackId,
            code: snackFiles,
            dependencies: dependencies,
            channel: channel,
            isStaging: isStaging,
            clearFirst: false,  // We already cleared above
            isLesson: isLesson,
            lessonId: lessonId,
            lessonDescription: lessonDescription
          )
        } else if let snackId = params["snackId"] as? String {
          // Published snack: fetch code from API
          await SnackEditingSession.shared.setupSession(
            snackId: snackId,
            channel: channel,
            isStaging: isStaging,
            name: name
          )
        }
      }

      // 3. Create the new app directly (not through linkingManager to avoid circular call)
      // The linking manager now routes through this bridge, so we call createNewApp directly.
      EXKernel.sharedInstance().createNewApp(with: appUrl, initialProps: nil)
      completion(true, nil)
    }
  }

  /// Convenience overload for non-snack apps (no session setup needed)
  @objc public func openApp(url: String, completion: @escaping (Bool, String?) -> Void) {
    openApp(url: url, snackParams: nil, completion: completion)
  }

  @objc public func isAuthenticated() -> Bool {
    return UserDefaults.standard.string(forKey: "expo-session-secret") != nil
  }

  @objc public func addHistoryItem(withUrl url: String, name: String, iconUrl: String?) {
    DispatchQueue.main.async { [weak self] in
      self?.homeViewModel?.addToRecentlyOpened(url: url, name: name, iconUrl: iconUrl)
    }
  }
}

extension HomeViewModel {
  func openAppViaBridge(url: String) {
    isLoadingApp = true
    ExpoGoHomeBridge.shared.openApp(url: url) { [weak self] success, error in
      DispatchQueue.main.async {
        self?.isLoadingApp = false
        if !success, let error {
          self?.showError(error)
        }
      }
    }
  }

  func openAppViaBridge(url: String, snackParams: NSDictionary) {
    isLoadingApp = true
    ExpoGoHomeBridge.shared.openApp(url: url, snackParams: snackParams) { [weak self] success, error in
      DispatchQueue.main.async {
        self?.isLoadingApp = false
        if !success, let error {
          self?.showError(error)
        }
      }
    }
  }

  func connectViewModelToBridge() {
    ExpoGoHomeBridge.shared.setHomeViewModel(self)
  }
}
