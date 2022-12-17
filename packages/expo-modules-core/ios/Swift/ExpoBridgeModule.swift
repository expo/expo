// Copyright 2022-present 650 Industries. All rights reserved.

import React
import Foundation

/**
 The classic bridge module that is responsible for:
 - Creating and owning the `AppContext` when the Expo modules architecture is automatically initialized
   by React Native (as opposed to native unit tests, where React Native is not used at all).
 - Installing the host object to the runtime.
 */
@objc(ExpoBridgeModule)
public final class ExpoBridgeModule: NSObject, RCTBridgeModule {
  @objc
  public let appContext: AppContext

  /**
   The initializer that is used by React Native when it loads bridge modules.
   In this scenario, we create an `AppContext` that manages the
   architecture of Expo modules and the app itself.
   */
  override init() {
    appContext = AppContext()
    super.init()
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  // MARK: - RCTBridgeModule

  public static func moduleName() -> String! {
    return "Expo"
  }

  public static func requiresMainQueueSetup() -> Bool {
    return true
  }

  public var bridge: RCTBridge! {
    didSet {
      appContext.reactBridge = bridge
      bridge.dispatchBlock({ [weak self] in
        guard let self = self, let bridge = self.appContext.reactBridge else {
          return
        }
        self.appContext.runtime = EXJavaScriptRuntimeManager.runtime(fromBridge: bridge)
      }, queue: RCTJSThread)
    }
  }
  
  /**
   This should be called inside EXNativeModulesProxy.setBridge()
   */
  @objc
  public func legacyProxyDidSetBridge(legacyModulesProxy: LegacyNativeModulesProxy,
                                      legacyModuleRegistry: EXModuleRegistry) {
    appContext.legacyModuleRegistry = legacyModuleRegistry
    appContext.legacyModulesProxy = legacyModulesProxy
    
    // we need to register all the modules after the legacy module registry is set
    // otherwise legacy modules (e.g. permissions) won't be available in OnCreate { }
    appContext.useModulesProvider("ExpoModulesProvider")
    appContext.moduleRegistry.register(moduleType: NativeModulesProxyModule.self)
  }
}
