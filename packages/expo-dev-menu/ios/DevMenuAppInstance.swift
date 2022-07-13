// Copyright 2015-present 650 Industries. All rights reserved.

import React

@objc
class DevMenuAppInstance: DevMenuBaseAppInstance, RCTBridgeDelegate {
  static private var CloseEventName = "closeDevMenu"
  static private var OpenEventName = "openDevMenu"

  private let manager: DevMenuManager

  var bridge: RCTBridge?

  init(manager: DevMenuManager) {
    self.manager = manager

    super.init()

    self.bridge = DevMenuRCTBridge.init(delegate: self, launchOptions: nil)
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

  // MARK: RCTBridgeDelegate

  func sourceURL(for bridge: RCTBridge!) -> URL! {
    #if DEBUG
    if let packagerHost = jsPackagerHost() {
      return RCTBundleURLProvider.jsBundleURL(forBundleRoot: "index", packagerHost: packagerHost, enableDev: true, enableMinification: false)
    }
    #endif
    return jsSourceUrl()
  }

  func extraModules(for bridge: RCTBridge!) -> [RCTBridgeModule]! {
    var modules: [RCTBridgeModule] = [DevMenuInternalModule(manager: manager)]
    modules.append(contentsOf: DevMenuVendoredModulesUtils.vendoredModules(bridge, addReanimated2: true))
    modules.append(DevMenuLoadingView.init())
    modules.append(DevMenuRCTDevSettings.init())
    return modules
  }

  func bridge(_ bridge: RCTBridge!, didNotFindModule moduleName: String!) -> Bool {
    return moduleName == "DevMenu"
  }

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
