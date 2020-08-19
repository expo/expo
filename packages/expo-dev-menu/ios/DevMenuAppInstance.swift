// Copyright 2015-present 650 Industries. All rights reserved.

class DevMenuAppInstance: NSObject, RCTBridgeDelegate {
  static private var CloseEventName = "closeDevMenu"

  private let manager: DevMenuManager
  private let moduleRegistryAdapter: UMModuleRegistryAdapter

  var bridge: RCTBridge?

  init(manager: DevMenuManager) {
    self.manager = manager
    self.moduleRegistryAdapter = UMModuleRegistryAdapter.init(moduleRegistryProvider: UMModuleRegistryProvider.init());

    super.init()

    self.bridge = RCTBridge.init(delegate: self, launchOptions: nil)
  }

  /**
   Sends an event to JS triggering the animation that collapses the dev menu.
   */
  public func sendCloseEvent() {
    bridge?.enqueueJSCall("RCTDeviceEventEmitter.emit", args: [DevMenuAppInstance.CloseEventName])
  }

  // MARK: RCTBridgeDelegate

  func sourceURL(for bridge: RCTBridge!) -> URL! {
    #if DEBUG
    if let packagerHost = jsPackagerHost() {
      if RCTBundleURLProvider.sharedSettings()?.isPackagerRunning(packagerHost) == true {
        return RCTBundleURLProvider.jsBundleURL(forBundleRoot: "index", packagerHost: packagerHost, enableDev: true, enableMinification: false)
      }
      print("Expo DevMenu packager host \(packagerHost) not found, falling back to bundled source file...");
    }
    #endif
    return jsSourceUrl()
  }

  func extraModules(for bridge: RCTBridge!) -> [RCTBridgeModule]! {
    let internalModule = DevMenuInternalModule(manager: manager)

    var modules: [RCTBridgeModule] = [internalModule]
    modules.append(contentsOf: moduleRegistryAdapter.extraModules(for: bridge))

    return modules
  }

  func bridge(_ bridge: RCTBridge!, didNotFindModule moduleName: String!) -> Bool {
    return moduleName == "DevMenu"
  }

  // MARK: private

  private func resourcesBundle() -> Bundle? {
    let frameworkBundle = Bundle(for: DevMenuAppInstance.self)

    guard let resourcesBundleUrl = frameworkBundle.url(forResource: "EXDevMenu", withExtension: "bundle") else {
      return nil
    }
    return Bundle(url: resourcesBundleUrl)
  }

  private func jsSourceUrl() -> URL? {
    return resourcesBundle()?.url(forResource: "EXDevMenuApp.ios", withExtension: "js")
  }

  private func jsPackagerHost() -> String? {
    // Return `nil` if resource doesn't exist in the bundle.
    guard let packagerHostPath = resourcesBundle()?.path(forResource: "dev-menu-packager-host", ofType: nil) else {
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
