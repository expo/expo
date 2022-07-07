import UIKit

/**
 The app context is an interface to a single Expo app.
 */
@objc(EXAppContext)
public final class AppContext: NSObject {
  internal static func create() -> AppContext {
    let appContext = AppContext()

    appContext.runtime = JavaScriptRuntime()
    return appContext
  }

  /**
   The module registry for the app context.
   */
  public private(set) lazy var moduleRegistry: ModuleRegistry = {
    isModuleRegistryInitialized = true
    return ModuleRegistry(appContext: self)
  }()

  /**
   Whether the module registry for this app context has already been initialized.
   */
  private var isModuleRegistryInitialized: Bool = false

  /**
   The legacy module registry with modules written in the old-fashioned way.
   */
  internal weak var legacyModuleRegistry: EXModuleRegistry?

  internal weak var legacyModulesProxy: LegacyNativeModulesProxy?

  /**
   React bridge of the context's app. Can be `nil` when the bridge
   hasn't been propagated to the bridge modules yet (see ``ExpoBridgeModule``),
   or when the app context is "bridgeless" (for example in native unit tests).
   */
  @objc
  public internal(set) weak var reactBridge: RCTBridge?

  /**
   JSI runtime of the running app.
   */
  @objc
  public var runtime: JavaScriptRuntime? {
    didSet {
      if runtime == nil {
        // When the runtime is unpinned from the context (e.g. deallocated),
        // we should make sure to release all JS objects from the memory.
        // Otherwise the JSCRuntime asserts may fail on deallocation.
        releaseRuntimeObjects()
      } else if runtime != oldValue {
        // Try to install ExpoModules host object automatically when the runtime changes.
        // TODO: Should we uninstall in the old runtime? (@tsapeta)
        try? installExpoModulesHostObject()
      }
    }
  }

  /**
   Designated initializer without modules provider.
   */
  public override init() {
    super.init()
    listenToClientAppNotifications()
  }

  @discardableResult
  public func useModulesProvider(_ providerName: String) -> Self {
    return useModulesProvider(Self.modulesProvider(withName: providerName))
  }

  @discardableResult
  public func useModulesProvider(_ provider: ModulesProvider) -> Self {
    moduleRegistry.register(fromProvider: provider)
    return self
  }

  /**
   Returns a legacy module implementing given protocol/interface.
   */
  public func legacyModule<ModuleProtocol>(implementing moduleProtocol: Protocol) -> ModuleProtocol? {
    return legacyModuleRegistry?.getModuleImplementingProtocol(moduleProtocol) as? ModuleProtocol
  }

  /**
   Provides access to app's constants from legacy module registry.
   */
  public var constants: EXConstantsInterface? {
    return legacyModule(implementing: EXConstantsInterface.self)
  }

  /**
   Provides access to the file system manager from legacy module registry.
   */
  public var fileSystem: EXFileSystemInterface? {
    return legacyModule(implementing: EXFileSystemInterface.self)
  }

  /**
   Provides access to the permissions manager from legacy module registry.
   */
  public var permissions: EXPermissionsInterface? {
    return legacyModule(implementing: EXPermissionsInterface.self)
  }

  /**
   Provides access to the image loader from legacy module registry.
   */
  public var imageLoader: EXImageLoaderInterface? {
    return legacyModule(implementing: EXImageLoaderInterface.self)
  }

  /**
   Provides access to the utilities from legacy module registry.
   */
  public var utilities: EXUtilitiesInterface? {
    return legacyModule(implementing: EXUtilitiesInterface.self)
  }

  /**
   Provides access to the event emitter from legacy module registry.
   */
  public var eventEmitter: EXEventEmitterService? {
    return legacyModule(implementing: EXEventEmitterService.self)
  }

  /**
   Starts listening to `UIApplication` notifications.
   */
  private func listenToClientAppNotifications() {
    [
      UIApplication.willEnterForegroundNotification,
      UIApplication.didBecomeActiveNotification,
      UIApplication.didEnterBackgroundNotification
    ].forEach { name in
      NotificationCenter.default.addObserver(self, selector: #selector(handleClientAppNotification(_:)), name: name, object: nil)
    }
  }

  /**
   Handles app's (`UIApplication`) lifecycle notifications and posts appropriate events to the module registry.
   */
  @objc
  private func handleClientAppNotification(_ notification: Notification) {
    switch notification.name {
    case UIApplication.willEnterForegroundNotification:
      moduleRegistry.post(event: .appEntersForeground)
    case UIApplication.didBecomeActiveNotification:
      moduleRegistry.post(event: .appBecomesActive)
    case UIApplication.didEnterBackgroundNotification:
      moduleRegistry.post(event: .appEntersBackground)
    default:
      return
    }
  }

  // MARK: - Interop with NativeModulesProxy

  /**
   Returns view modules wrapped by the base `ViewModuleWrapper` class.
   */
  @objc
  public func getViewManagers() -> [ViewModuleWrapper] {
    return moduleRegistry.compactMap { holder in
      if holder.definition.viewManager != nil {
        return ViewModuleWrapper(holder)
      } else {
        return nil
      }
    }
  }

  /**
   Returns a bool whether the module with given name is registered in this context.
   */
  @objc
  public func hasModule(_ moduleName: String) -> Bool {
    return moduleRegistry.has(moduleWithName: moduleName)
  }

  /**
   Returns an array of names of the modules registered in the module registry.
   */
  @objc
  public func getModuleNames() -> [String] {
    return moduleRegistry.getModuleNames()
  }

  /**
   Returns a JavaScript object that represents a module with given name.
   When remote debugging is enabled, this will always return `nil`.
   */
  @objc
  public func getNativeModuleObject(_ moduleName: String) -> JavaScriptObject? {
    return moduleRegistry.get(moduleHolderForName: moduleName)?.javaScriptObject
  }

  /**
   Returns an array of event names supported by all Swift modules.
   */
  @objc
  public func getSupportedEvents() -> [String] {
    return moduleRegistry.reduce(into: [String]()) { events, holder in
      events.append(contentsOf: holder.definition.eventNames)
    }
  }

  /**
   Modifies listeners count for module with given name. Depending on the listeners count,
   `onStartObserving` and `onStopObserving` are called.
   */
  @objc
  public func modifyEventListenersCount(_ moduleName: String, count: Int) {
    moduleRegistry
      .get(moduleHolderForName: moduleName)?
      .modifyListenersCount(count)
  }

  /**
   Asynchronously calls module's function with given arguments.
   */
  @objc
  public func callFunction(
    _ functionName: String,
    onModule moduleName: String,
    withArgs args: [Any],
    resolve: @escaping EXPromiseResolveBlock,
    reject: @escaping EXPromiseRejectBlock
  ) {
    moduleRegistry
      .get(moduleHolderForName: moduleName)?
      .call(function: functionName, args: args) { result in
        switch result {
        case .failure(let error):
          reject(error.code, error.description, error)
        case .success(let value):
          resolve(value)
        }
      }
  }

  @objc
  public final lazy var expoModulesConfig = ModulesProxyConfig(constants: self.exportedModulesConstants(),
                                                               methodNames: self.exportedFunctionNames(),
                                                               viewManagers: self.viewManagersMetadata())

  private func exportedFunctionNames() -> [String: [[String: Any]]] {
    var constants = [String: [[String: Any]]]()

    for holder in moduleRegistry {
      constants[holder.name] = holder.definition.functions.map({ functionName, function in
        return [
          "name": functionName,
          "argumentsCount": function.argumentsCount,
          "key": functionName
        ]
      })
    }
    return constants
  }

  private func exportedModulesConstants() -> [String: Any] {
    return moduleRegistry
      // prevent infinite recursion - exclude NativeProxyModule constants
      .filter { $0.name != NativeModulesProxyModule.moduleName }
      .reduce(into: [String: Any]()) { acc, holder in
        acc[holder.name] = holder.getConstants()
      }
  }

  private func viewManagersMetadata() -> [String: Any] {
    return moduleRegistry.reduce(into: [String: Any]()) { acc, holder in
      if let viewManager = holder.definition.viewManager {
        acc[holder.name] = [
          "propsNames": viewManager.props.map { $0.name }
        ]
      }
    }
  }

  // MARK: - Runtime

  internal func installExpoModulesHostObject() throws {
    guard runtime != nil else {
      throw RuntimeLostException()
    }
    EXJavaScriptRuntimeManager.installExpoModulesHostObject(self)
  }

  /**
   Unsets runtime objects that we hold for each module.
   */
  private func releaseRuntimeObjects() {
    for module in moduleRegistry {
      module.javaScriptObject = nil
    }
  }

  // MARK: - Deallocation

  /**
   Cleans things up before deallocation.
   */
  deinit {
    NotificationCenter.default.removeObserver(self)

    // Post an event to the registry only if it was already created.
    // If we let it to lazy-load here, that would crash since the module registry
    // has a weak reference to the app context which is being deallocated.
    if isModuleRegistryInitialized {
      moduleRegistry.post(event: .appContextDestroys)
    }
  }

  // MARK: - Statics

  /**
   Returns an instance of the generated Expo modules provider.
   The provider is usually generated in application's `ExpoModulesProviders` files group.
   */
  @objc
  public static func modulesProvider(withName providerName: String = "ExpoModulesProvider") -> ModulesProvider {
    // [0] When ExpoModulesCore is built as separated framework/module,
    // we should explicitly load main bundle's `ExpoModulesProvider` class.
    if let bundleName = Bundle.main.infoDictionary?["CFBundleName"],
       let providerClass = NSClassFromString("\(bundleName).\(providerName)") as? ModulesProvider.Type {
      return providerClass.init()
    }

    // [1] Fallback to `ExpoModulesProvider` class from the current module.
    if let providerClass = NSClassFromString(providerName) as? ModulesProvider.Type {
      return providerClass.init()
    }

    // [2] Fallback to an empty `ModulesProvider` if `ExpoModulesProvider` was not generated
    return ModulesProvider()
  }
}

// MARK: - Public exceptions

public final class AppContextLostException: Exception {
  override public var reason: String {
    "The app context has been lost"
  }
}

public final class RuntimeLostException: Exception {
  override public var reason: String {
    "The JavaScript runtime has been lost"
  }
}
