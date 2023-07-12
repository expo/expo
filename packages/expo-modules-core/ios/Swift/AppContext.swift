import UIKit

/**
 The app context is an interface to a single Expo app.
 */
@objc(EXAppContext)
public final class AppContext: NSObject {
  internal static func create() -> AppContext {
    let appContext = AppContext()

    appContext._runtime = ExpoRuntime()
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
  public weak var legacyModuleRegistry: EXModuleRegistry?

  internal weak var legacyModulesProxy: LegacyNativeModulesProxy?

  /**
   React bridge of the context's app. Can be `nil` when the bridge
   hasn't been propagated to the bridge modules yet (see ``ExpoBridgeModule``),
   or when the app context is "bridgeless" (for example in native unit tests).
   */
  @objc
  public internal(set) weak var reactBridge: RCTBridge?

  /**
   Underlying JSI runtime of the running app.
   */
  @objc
  public var _runtime: ExpoRuntime? {
    didSet {
      if _runtime == nil {
        // When the runtime is unpinned from the context (e.g. deallocated),
        // we should make sure to release all JS objects from the memory.
        // Otherwise the JSCRuntime asserts may fail on deallocation.
        releaseRuntimeObjects()
      } else if _runtime != oldValue {
        // Try to install the core object automatically when the runtime changes.
        try? prepareRuntime()
      }
    }
  }

  /**
   JSI runtime of the running app.
   */
  public var runtime: ExpoRuntime {
    get throws {
      if let runtime = _runtime {
        return runtime
      }
      throw Exceptions.RuntimeLost()
    }
  }

  /**
   The core module that defines the `expo` object in the global scope of Expo runtime.
   */
  internal private(set) lazy var coreModule = CoreModule(appContext: self)

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

  // MARK: - UI

  public func findView<ViewType>(withTag viewTag: Int, ofType type: ViewType.Type) -> ViewType? {
    let view: UIView? = reactBridge?.uiManager.view(forReactTag: NSNumber(value: viewTag))

    #if RN_FABRIC_ENABLED
    if let view = view as? ExpoFabricViewObjC {
      return view.contentView as? ViewType
    }
    #endif
    return view as? ViewType
  }

  // MARK: - Running on specific queues

  /**
   Runs a code block on the JavaScript thread.
   */
  public func executeOnJavaScriptThread(runBlock: @escaping (() -> Void)) {
    reactBridge?.dispatchBlock(runBlock, queue: RCTJSThread)
  }

  // MARK: - Classes

  /**
   A registry containing references to JavaScript classes.
   - ToDo: Make one registry per module, not the entire app context.
   Perhaps it should be kept by the `ModuleHolder`.
   */
  internal let classRegistry = ClassRegistry()

  /**
   Creates a new JavaScript object with the class prototype associated with the given native class.
   - ToDo: Move this to `ModuleHolder` along the `classRegistry` property.
   */
  internal func newObject(nativeClassId: ObjectIdentifier) throws -> JavaScriptObject? {
    guard let jsClass = classRegistry.getJavaScriptClass(nativeClassId: nativeClassId) else {
      // TODO: Define a JS class for SharedRef in the CoreModule and then use it here instead of a raw object (?)
      return try runtime.createObject()
    }
    let prototype = try jsClass.getProperty("prototype").asObject()
    let object = try runtime.createObject(withPrototype: prototype)

    return object
  }

  // MARK: - Legacy modules

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

  internal func prepareRuntime() throws {
    let runtime = try runtime
    let coreObject = try coreModule.definition().build(appContext: self)

    // Initialize `global.expo`.
    try runtime.initializeCoreObject(coreObject)

    // Install the modules host object as the `global.expo.modules`.
    EXJavaScriptRuntimeManager.installExpoModulesHostObject(self)
  }

  /**
   Unsets runtime objects that we hold for each module.
   */
  private func releaseRuntimeObjects() {
    // FIXME: Release objects only from the current context.
    // Making the registry non-global (similarly to the class registry) would fix it.
    SharedObjectRegistry.clear()
    classRegistry.clear()

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

// Deprecated since v1.0.0
@available(*, deprecated, renamed: "Exceptions.AppContextLost")
public typealias AppContextLostException = Exceptions.AppContextLost

// Deprecated since v1.0.0
@available(*, deprecated, renamed: "Exceptions.RuntimeLost")
public typealias RuntimeLostException = Exceptions.RuntimeLost
