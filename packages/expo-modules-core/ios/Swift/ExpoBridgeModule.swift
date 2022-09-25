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

    // Listen to React Native notifications posted just before the JS is executed.
    NotificationCenter.default.addObserver(self,
                                           selector: #selector(javaScriptWillStartExecutingNotification(_:)),
                                           name: NSNotification.Name.RCTJavaScriptWillStartExecuting,
                                           object: nil)
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

  // MARK: - Notifications

  @objc
  public func javaScriptWillStartExecutingNotification(_ notification: Notification) {
    if (notification.object as? RCTBridge)?.batched == bridge {
      // The JavaScript bundle will start executing in a moment,
      // so the runtime is already initialized and we can get it from the bridge.
      // This should automatically install the ExpoModules host object.
      appContext.runtime = EXJavaScriptRuntimeManager.runtime(fromBridge: bridge)
    }
  }
}
