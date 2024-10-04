// Copyright 2023-present 650 Industries. All rights reserved.

import React
import ExpoModulesCore
import EXManifests

/**
 Manages the React Native app opened in Expo Go. As opposed to ``EXReactAppManager`` and ``EXHomeAppManager``,
 this manager is versioned and used by them under the hood like an adapter.
 */
@objc(EXVersionManager)
final class VersionManager: EXVersionManagerObjC {
  var appContext: AppContext?
  var legacyModulesProxy: LegacyNativeModulesProxy?
  var legacyModuleRegistry: EXModuleRegistry?

  let params: [AnyHashable: Any]

  let manifest: Manifest

  @objc
  override init(
    params: [AnyHashable: Any],
    manifest: Manifest,
    fatalHandler: @escaping (Error?) -> Void,
    logFunction: @escaping RCTLogFunction,
    logThreshold: RCTLogLevel
  ) {
    self.params = params
    self.manifest = manifest

    configureReact(
      enableTurboModules: manifest.experiments()?["turboModules"] as? Bool ?? false,
      fatalHandler: fatalHandler,
      logFunction: logFunction,
      logThreshold: logThreshold
    )
    super.init(params: params, manifest: manifest, fatalHandler: fatalHandler, logFunction: logFunction, logThreshold: logThreshold)
  }

  /**
   Invalidates the app context when the bridge is about to be rebuilt.
   */
  override func invalidate() {
    appContext = nil
    super.invalidate()
  }

  /**
   Returns a list of bridge modules to register when the bridge initializes.
   */
  @objc
  override func extraModules(forBridge bridge: Any) -> [Any] {
    // Ideally if we don't initialize the app context here, but unfortunately there is no better place in bridge lifecycle
    // that would work well for us (especially properly invalidating existing app context on reload).
    let legacyModuleRegistry = createLegacyModuleRegistry(params: params, manifest: manifest)
    let legacyModulesProxy = LegacyNativeModulesProxy(customModuleRegistry: legacyModuleRegistry)
    let appContext = AppContext(legacyModulesProxy: legacyModulesProxy, legacyModuleRegistry: legacyModuleRegistry)

    self.appContext = appContext
    self.legacyModuleRegistry = legacyModuleRegistry
    self.legacyModulesProxy = legacyModulesProxy

    let modules: [Any] = [
      EXAppState(),
      EXDisabledDevLoadingView(),
      EXStatusBarManager(),

      // Adding EXNativeModulesProxy with the custom moduleRegistry.
      legacyModulesProxy,

      // Adding the way to access the module registry from RCTBridgeModules.
      EXModuleRegistryHolderReactModule(moduleRegistry: legacyModuleRegistry),

      // When ExpoBridgeModule is initialized by RN, it automatically creates the app context.
      // In Expo Go, it has to use already created app context.
      ExpoBridgeModule(appContext: appContext)
    ]

    // Register additional Expo modules, specific to Expo Go.
    registerExpoModules()

    return modules + super.extraModules(forBridge: bridge)
  }

  /**
   Registers Expo modules that are not generated in ``ExpoModulesProvider``, but are necessary for Expo Go apps.
   */
  private func registerExpoModules() {
    appContext?.moduleRegistry.register(moduleType: ExpoGoModule.self)
  }
}

/**
 Configures some React Native global options.
 */
private func configureReact(
  enableTurboModules: Bool,
  fatalHandler: @escaping (Error?) -> Void,
  logFunction: @escaping RCTLogFunction,
  logThreshold: RCTLogLevel
) {
  RCTEnableTurboModule(enableTurboModules)
  RCTSetFatalHandler(fatalHandler)
  RCTSetLogThreshold(logThreshold)
  RCTSetLogFunction(logFunction)
}

/**
 Creates a module registry for legacy Expo modules.
 */
private func createLegacyModuleRegistry(params: [AnyHashable: Any], manifest: Manifest) -> EXModuleRegistry {
  guard let singletonModules = params["singletonModules"] as? Set<AnyHashable> else {
    fatalError("Singleton modules param cannot be cast to Set<AnyHashable>")
  }
  let moduleRegistryProvider = ModuleRegistryProvider(singletonModules: singletonModules)
  let moduleRegistryAdapter = EXScopedModuleRegistryAdapter(moduleRegistryProvider: moduleRegistryProvider)

  moduleRegistryProvider.moduleRegistryDelegate = EXScopedModuleRegistryDelegate(params: params)

  return moduleRegistryAdapter.moduleRegistry(
    forParams: params,
    forExperienceStableLegacyId: manifest.stableLegacyId(),
    scopeKey: manifest.scopeKey(),
    manifest: manifest,
    withKernelServices: params["services"] as? [AnyHashable: Any]
  )
}
