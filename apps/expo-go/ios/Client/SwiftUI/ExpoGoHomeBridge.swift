// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import UIKit

@objc public class ExpoGoHomeBridge: NSObject {
  @objc public static let shared = ExpoGoHomeBridge()

  private override init() {
    super.init()
  }

  @objc public func openApp(url: String, completion: @escaping (Bool, String?) -> Void) {
    guard URL(string: url) != nil else {
      completion(false, "Invalid URL: \(url)")
      return
    }

    DispatchQueue.main.async {
      let kernel = EXKernel.sharedInstance()
      let linkingManager = kernel.serviceRegistry.linkingManager

      linkingManager?.openUrl(url, isUniversalLink: false)
      completion(true, nil)
    }
  }

  @objc public func addToHistory(url: String, appName: String) {
    let kernel = EXKernel.sharedInstance()
    if let homeAppRecord = kernel.appRegistry.homeAppRecord,
       let homeAppManager = homeAppRecord.appManager as? EXHomeAppManager,
       let manifestUrl = URL(string: url) {
    }
  }

  @objc public func isAuthenticated() -> Bool {
    return UserDefaults.standard.string(forKey: "expo-session-secret") != nil
  }
}

extension HomeViewModel {
  func openAppViaBridge(url: String) {
    ExpoGoHomeBridge.shared.openApp(url: url) { [weak self] success, error in
      DispatchQueue.main.async {
        if success {
          self?.addToRecentlyOpened(url: url, name: self?.extractAppName(from: url) ?? url)
        } else if let error = error {
          self?.showErrorAlert(error)
        }
      }
    }
  }
}
