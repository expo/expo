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

    // Determine status text based on what we're opening
    let isLesson = (snackParams?["isLesson"] as? Bool) == true
    let isPlayground = (snackParams?["isPlayground"] as? Bool) == true
    let isLessonLike = isLesson || isPlayground || snackParams?["lessonDescription"] != nil

    // Show loading overlay
    if isLessonLike {
      let sfSymbol = snackParams?["loadingIcon"] as? String ?? "book.fill"
      let icon = Self.makeLoadingIcon(sfSymbol: sfSymbol)
      let fixedDelay = snackParams?["loadingFixedDelay"] as? Double ?? 0
      let minDuration = fixedDelay > 0 ? 0 : 0.5  // Use minimum display duration unless a fixed delay is set
      EXKernel.sharedInstance().browserController.showAppLoadingOverlay(withStatusText: "Preparing playground...", iconImage: icon, dismissDelay: minDuration, fixedDismissDelay: fixedDelay)
    } else {
      EXKernel.sharedInstance().browserController.showAppLoadingOverlay(withStatusText: "Opening project...")
    }

    // For non-snack apps, open synchronously to avoid timing issues with native module registration.
    // The async Task wrapper was causing race conditions where the app would start before
    // native components were fully registered.
    guard let params = snackParams, let channel = params["channel"] as? String else {
      // Non-snack app: clear session and open synchronously
      // We're called from RCTExecuteOnMainQueue so we're already on the main thread
      MainActor.assumeIsolated {
        SnackEditingSession.shared.clearSession()
      }
      DevMenuManager.shared.isLessonLikeSession = false
      EXKernel.sharedInstance().createNewApp(with: appUrl, initialProps: nil)
      completion(true, nil)
      return
    }

    // Snack app: need async for session setup
    Task { @MainActor in
      // 1. Clear session before any setup.
      // This ensures the FAB sees cleared state when the app starts loading.
      SnackEditingSession.shared.clearSession()

      // 2. Set up the snack session
      let isStaging = params["isStaging"] as? Bool ?? false
      let isLesson = params["isLesson"] as? Bool ?? false
      let lessonId = params["lessonId"] as? Int
      let lessonDescription = params["lessonDescription"] as? String
      let name = params["name"] as? String

      // Tell the dev menu whether this is a lesson-like session so it always shows the FAB
      DevMenuManager.shared.isLessonLikeSession = isLesson || isPlayground || lessonDescription != nil

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
          lessonDescription: lessonDescription,
          isEmbedded: true  // Use direct native transport, skip Snackpub WebSocket
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

  /// Creates a blue gradient rounded-rect icon with a white SF Symbol, matching the style
  /// used for lesson rows and the demo project card in the home screen.
  private static func makeLoadingIcon(sfSymbol: String) -> UIImage {
    let size = CGSize(width: 80, height: 80)
    let cornerRadius: CGFloat = 25

    let renderer = UIGraphicsImageRenderer(size: size)
    return renderer.image { context in
      let rect = CGRect(origin: .zero, size: size)

      // Blue gradient background (matches expoBlue)
      let path = UIBezierPath(roundedRect: rect, cornerRadius: cornerRadius)
      path.addClip()

      let colors = [
        UIColor(red: 0.235, green: 0.624, blue: 0.996, alpha: 1).cgColor,  // #3c9ffe
        UIColor(red: 0.008, green: 0.455, blue: 0.875, alpha: 1).cgColor   // #0274df
      ]
      if let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors as CFArray, locations: [0, 1]) {
        context.cgContext.drawLinearGradient(gradient, start: CGPoint(x: size.width / 2, y: 0), end: CGPoint(x: size.width / 2, y: size.height), options: [])
      }

      // White SF Symbol centered
      let symbolConfig = UIImage.SymbolConfiguration(pointSize: 36, weight: .semibold)
      if let symbol = UIImage(systemName: sfSymbol, withConfiguration: symbolConfig)?.withTintColor(.white, renderingMode: .alwaysOriginal) {
        let symbolSize = symbol.size
        let symbolOrigin = CGPoint(x: (size.width - symbolSize.width) / 2, y: (size.height - symbolSize.height) / 2)
        symbol.draw(at: symbolOrigin)
      }
    }
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
          EXKernel.sharedInstance().browserController.hideAppLoadingOverlay()
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
          EXKernel.sharedInstance().browserController.hideAppLoadingOverlay()
          self?.showError(error)
        }
      }
    }
  }

  func connectViewModelToBridge() {
    ExpoGoHomeBridge.shared.setHomeViewModel(self)
  }
}
