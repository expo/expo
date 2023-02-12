// Copyright 2022-present 650 Industries. All rights reserved.

import ABI47_0_0React
import Foundation

/**
 The classic bridge module that is responsible for:
 - Creating and owning the `AppContext` when the Expo modules architecture is automatically initialized
   by ABI47_0_0React Native (as opposed to native unit tests, where ABI47_0_0React Native is not used at all).
 - Installing the host object to the runtime.
 */
@objc(ABI47_0_0ExpoBridgeModule)
public final class ABI47_0_0ExpoBridgeModule: NSObject, ABI47_0_0RCTBridgeModule {
  @objc
  public let appContext: AppContext

  /**
   The initializer that is used by ABI47_0_0React Native when it loads bridge modules.
   In this scenario, we create an `AppContext` that manages the
   architecture of Expo modules and the app itself.
   */
  override init() {
    appContext = AppContext()
    super.init()

    // Listen to ABI47_0_0React Native notifications posted just before the JS is executed.
    NotificationCenter.default.addObserver(self,
                                           selector: #selector(javaScriptWillStartExecutingNotification(_:)),
                                           name: NSNotification.Name.ABI47_0_0RCTJavaScriptWillStartExecuting,
                                           object: nil)
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  // MARK: - ABI47_0_0RCTBridgeModule

  public static func moduleName() -> String! {
    return "Expo"
  }

  public static func requiresMainQueueSetup() -> Bool {
    return true
  }

  public var bridge: ABI47_0_0RCTBridge! {
    didSet {
      appContext.reactBridge = bridge
    }
  }
  
  /**
   This should be called inside ABI47_0_0EXNativeModulesProxy.setBridge()
   */
  @objc
  public func legacyProxyDidSetBridge(legacyModulesProxy: LegacyNativeModulesProxy,
                                      legacyModuleRegistry: ABI47_0_0EXModuleRegistry) {
    appContext.legacyModuleRegistry = legacyModuleRegistry
    appContext.legacyModulesProxy = legacyModulesProxy
    
    // we need to register all the modules after the legacy module registry is set
    // otherwise legacy modules (e.g. permissions) won't be available in OnCreate { }
    appContext.useModulesProvider("ABI47_0_0ExpoModulesProvider")
    appContext.moduleRegistry.register(moduleType: NativeModulesProxyModule.self)
  }

  // MARK: - Notifications

  @objc
  public func javaScriptWillStartExecutingNotification(_ notification: Notification) {
    if (notification.object as? ABI47_0_0RCTBridge)?.batched == bridge {
      // The JavaScript bundle will start executing in a moment,
      // so the runtime is already initialized and we can get it from the bridge.
      // This should automatically install the ExpoModules host object.
      appContext.runtime = ABI47_0_0EXJavaScriptRuntimeManager.runtime(fromBridge: bridge)
    }
  }
}
