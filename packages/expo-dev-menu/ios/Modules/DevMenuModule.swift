// Copyright 2015-present 650 Industries. All rights reserved.

@objc(DevMenuModule)
open class DevMenuModule: NSObject {
  deinit {
    // cleanup registered callbacks when the bridge is deallocated to prevent these leaking into other (potentially unrelated) bridges
    DevMenuManager.shared.registeredCallbacks = []
  }
  
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
  
  @objc
  func addDevMenuCallbacks(_ names: [String], resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    DevMenuManager.shared.registeredCallbacks = names
    return resolve(nil)
  }
}
