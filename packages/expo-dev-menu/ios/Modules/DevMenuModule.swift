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

  @objc
  func queryDevSessionsAsync(_ installationID: String?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    DevMenuManager.shared.expoApiClient.queryDevSessionsAsync(installationID, completionHandler: { data, response, error in
      guard error == nil else {
        reject("ERR_DEVMENU_CANNOT_GET_DEV_SESSIONS", error.debugDescription, error)
        return
      }

      guard let data = data else {
        resolve(nil)
        return
      }

      let response = String(decoding: data, as: UTF8.self)
      resolve(response)
    })
  }
}
