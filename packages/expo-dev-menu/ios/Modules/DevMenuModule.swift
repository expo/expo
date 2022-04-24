// Copyright 2015-present 650 Industries. All rights reserved.

@objc(DevMenuModule)
open class DevMenuModule: NSObject {
  // MARK: JavaScript API

  @objc
  func openMenu() {
    DevMenuManager.shared.openMenu()
  }

  @objc
  func openSettings() {
    DevMenuManager.shared.openMenu("Settings")
  }

  @objc
  func openProfile() {
    DevMenuManager.shared.openMenu("Profile")
  }

  @objc
  func isLoggedInAsync(_ resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    resolve(DevMenuManager.shared.expoApiClient.isLoggedIn())
  }
}
