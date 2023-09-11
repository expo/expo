// Copyright 2015-present 650 Industries. All rights reserved.

import React

@objc
class DevMenuAppInstance: DevMenuRCTAppDelegate {
  static private var CloseEventName = "closeDevMenu"
  static private var OpenEventName = "openDevMenu"

  private let manager: DevMenuManager


  init(manager: DevMenuManager) {
    self.manager = manager

    super.init()
    self.createBridgeAndSetAdapter(launchOptions: nil)
  }

  init(manager: DevMenuManager, bridge: RCTBridge) {
    self.manager = manager

    super.init()

    self.bridge = bridge
  }

  /**
   Sends an event to JS triggering the animation that collapses the dev menu.
   */
  public func sendCloseEvent() {
    bridge?.enqueueJSCall("RCTDeviceEventEmitter.emit", args: [DevMenuAppInstance.CloseEventName])
  }

  public func sendOpenEvent() {
    bridge?.enqueueJSCall("RCTDeviceEventEmitter.emit", args: [DevMenuAppInstance.OpenEventName])
  }

  // MARK: RCTAppDelegate

  // swiftlint:disable implicitly_unwrapped_optional
  override func sourceURL(for bridge: RCTBridge!) -> URL! {
    #if DEBUG
    if let packagerHost = jsPackagerHost() {
      return RCTBundleURLProvider.jsBundleURL(
        forBundleRoot: "index",
        packagerHost: packagerHost,
        enableDev: true,
        enableMinification: false)
    }
    #endif
    return jsSourceUrl()
  }

  override func extraModules(for bridge: RCTBridge!) -> [RCTBridgeModule]! {
    var modules: [RCTBridgeModule] = [DevMenuLoadingView.init()]
    modules.append(DevMenuRCTDevSettings.init())
    return modules
  }

  override func bridge(_ bridge: RCTBridge!, didNotFindModule moduleName: String!) -> Bool {
    return moduleName == "DevMenu"
  }
  // swiftlint:enable implicitly_unwrapped_optional

  // MARK: private

  private func jsSourceUrl() -> URL? {
    return DevMenuUtils.resourcesBundle()?.url(forResource: "EXDevMenuApp.ios", withExtension: "js")
  }

  private func jsPackagerHost() -> String? {
    // Return `nil` if resource doesn't exist in the bundle.
    guard let packagerHostPath = DevMenuUtils.resourcesBundle()?.path(forResource: "dev-menu-packager-host", ofType: nil) else {
      return nil
    }
    // Return `nil` if the content is not a valid URL.
    guard let content = try? String(contentsOfFile: packagerHostPath, encoding: String.Encoding.utf8).trimmingCharacters(in: CharacterSet.newlines),
      let url = URL(string: content) else {
      return nil
    }
    return url.absoluteString
  }
}
