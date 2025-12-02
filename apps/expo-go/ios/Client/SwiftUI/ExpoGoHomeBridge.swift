// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import UIKit

@objc public class ExpoGoHomeBridge: NSObject {
  @objc public static let shared = ExpoGoHomeBridge()
  private weak var homeViewModel: HomeViewModel?

  private override init() {
    super.init()
  }

  func setHomeViewModel(_ viewModel: HomeViewModel) {
    self.homeViewModel = viewModel
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
    ExpoGoHomeBridge.shared.openApp(url: url) { [weak self] success, error in
      DispatchQueue.main.async {
        if !success, let error {
          self?.showErrorAlert(error)
        }
      }
    }
  }

  func connectViewModelToBridge() {
    ExpoGoHomeBridge.shared.setHomeViewModel(self)
  }
}
