// Copyright 2022-present 650 Industries. All rights reserved.

import ABI48_0_0React
import Foundation

/**
 The classic bridge module that is responsible for:
 - Creating and owning the `AppContext` when the Expo modules architecture is automatically initialized
   by ABI48_0_0React Native (as opposed to native unit tests, where ABI48_0_0React Native is not used at all).
 - Installing the host object to the runtime.
 */
@objc(ABI48_0_0ExpoBridgeModule)
public final class ABI48_0_0ExpoBridgeModule: NSObject, ABI48_0_0RCTBridgeModule {
  @objc
  public let appContext: AppContext

  /**
   The initializer that is used by ABI48_0_0React Native when it loads bridge modules.
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

  // MARK: - ABI48_0_0RCTBridgeModule

  public static func moduleName() -> String! {
    return "Expo"
  }

  public static func requiresMainQueueSetup() -> Bool {
    return true
  }

  public var bridge: ABI48_0_0RCTBridge! {
    didSet {
      appContext.reactBridge = bridge

      let attachRuntime = { [weak self] in
        guard let self = self, let bridge = self.appContext.reactBridge else {
          return
        }
        self.appContext.runtime = ABI48_0_0EXJavaScriptRuntimeManager.runtime(fromBridge: bridge)
      }

      if bridge.responds(to: Selector(("runtime"))) {
        // Getting the `runtime` on a different thread than JS is considered to be dangerous.
        // However, we just checking if it exists. We don't do anything with it.
        let result = bridge.perform(Selector(("runtime")))
        if result == nil {
          // When exporting expo modules using `extraModulesForBridge` (e.g. in Expo Go),
          // the runtime won't be initiated before the bridge didSet method is called.
          // Therefore, we need to wait for the main thread to complete its initialization by dispatching on it first.
          bridge.dispatchBlock({ [weak self] in
            guard let self = self, let bridge = self.appContext.reactBridge else {
              return
            }
            bridge.dispatchBlock(attachRuntime, queue: ABI48_0_0RCTJSThread)
          }, queue: DispatchQueue.main)
          return
        }
      }

      bridge.dispatchBlock(attachRuntime, queue: ABI48_0_0RCTJSThread)
    }
  }
  
  /**
   This should be called inside ABI48_0_0EXNativeModulesProxy.setBridge()
   */
  @objc
  public func legacyProxyDidSetBridge(legacyModulesProxy: LegacyNativeModulesProxy,
                                      legacyModuleRegistry: ABI48_0_0EXModuleRegistry) {
    appContext.legacyModuleRegistry = legacyModuleRegistry
    appContext.legacyModulesProxy = legacyModulesProxy
    
    // we need to register all the modules after the legacy module registry is set
    // otherwise legacy modules (e.g. permissions) won't be available in OnCreate { }
    appContext.useModulesProvider("ABI48_0_0ExpoModulesProvider")
    appContext.moduleRegistry.register(moduleType: NativeModulesProxyModule.self)
  }
}
