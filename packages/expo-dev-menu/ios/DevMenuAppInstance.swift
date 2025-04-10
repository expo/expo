// Copyright 2015-present 650 Industries. All rights reserved.

import React
import ReactAppDependencyProvider
import React_RCTAppDelegate

@objc
class DevMenuAppInstance: DevMenuReactNativeFactoryDelegate {
  static private var CloseEventName = "closeDevMenu"
  static private var OpenEventName = "openDevMenu"

  private let manager: DevMenuManager
  var reactNativeFactory: RCTReactNativeFactory?

  init(manager: DevMenuManager) {
    self.manager = manager
    super.init()
    self.dependencyProvider = RCTAppDependencyProvider()
    self.reactNativeFactory = RCTReactNativeFactory(delegate: self)
  }

  func setBridge(_ bridge: RCTBridge) {
    self.reactNativeFactory?.rootViewFactory.bridge = bridge
  }

  /**
   Sends an event to JS triggering the animation that collapses the dev menu.
   */
  func sendCloseEvent() {
    self.reactNativeFactory?.rootViewFactory.bridge?.enqueueJSCall("RCTDeviceEventEmitter.emit", args: [DevMenuAppInstance.CloseEventName])
  }

  func sendOpenEvent() {
    self.reactNativeFactory?.rootViewFactory.bridge?.enqueueJSCall("RCTDeviceEventEmitter.emit", args: [DevMenuAppInstance.OpenEventName])
  }

  // MARK: RCTAppDelegate

  override func sourceURL(for bridge: RCTBridge) -> URL {
    return jsSourceUrl()
  }

  override func bundleURL() -> URL? {
    return jsSourceUrl()
  }

  override func bridge(_ bridge: RCTBridge, didNotFindModule moduleName: String) -> Bool {
    return moduleName == "DevMenu"
  }

  // MARK: private

  private func jsSourceUrl() -> URL {
    #if DEBUG
    if let packagerHost = jsPackagerHost(),
      let url = RCTBundleURLProvider.jsBundleURL(
        forBundleRoot: "packages/expo-dev-menu/index",
        packagerHost: packagerHost,
        enableDev: true,
        enableMinification: false,
        inlineSourceMap: false) {
      return url
    }
    #endif
    guard let url = DevMenuUtils.resourcesBundle()?.url(forResource: "EXDevMenuApp.ios", withExtension: "js") else {
      fatalError("Unable to get expo-dev-menu bundle URL")
    }
    return url
  }

  private func jsPackagerHost() -> String? {
    // Return `nil` if resource doesn't exist in the bundle.
    guard let packagerHostPath = DevMenuUtils.resourcesBundle()?.path(forResource: "dev-menu-packager-host", ofType: nil) else {
      return nil
    }
    // Return `nil` if the content is not a valid URL.
    guard let content = try? String(contentsOfFile: packagerHostPath, encoding: .utf8).trimmingCharacters(in: .newlines) else {
      return nil
    }
    guard let url = URL(string: "http://\(content)"), let host = url.host else {
      return nil
    }
    return "\(host):\(url.port ?? 8081)"
  }
}
