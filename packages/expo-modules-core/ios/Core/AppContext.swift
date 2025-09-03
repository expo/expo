import React

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
   The app context configuration.
   */
  public let config: AppContextConfig

  public lazy var jsLogger: Logger = {
    let loggerModule = self.moduleRegistry.get(moduleWithName: JSLoggerModule.name) as? JSLoggerModule
    guard let logger = loggerModule?.logger else {
      log.error("Failed to get the JSLoggerModule logger. Falling back to OS logger.")
      return log
    }
    return logger
  }()

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
  @objc
  public weak var legacyModuleRegistry: EXModuleRegistry? {
    didSet {
      if let registry = legacyModuleRegistry,
        let legacyModule = registry.getModuleImplementingProtocol(EXFileSystemInterface.self) as? EXFileSystemInterface,
        let fileSystemLegacyModule = legacyModule as? FileSystemLegacyUtilities {
        fileSystemLegacyModule.maybeInitAppGroupSharedDirectories(self.config.appGroupSharedDirectories)
      }
    }
  }

  @objc
  public weak var legacyModulesProxy: LegacyNativeModulesProxy?

  /**
   React bridge of the context's app. Can be `nil` when the bridge
   hasn't been propagated to the bridge modules yet (see ``ExpoBridgeModule``),
   or when the app context is "bridgeless" (for example in native unit tests).
   */
  @objc
  public weak var reactBridge: RCTBridge?

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
   The application identifier that is used to distinguish between different `RCTHost`.
   It might be equal to `nil`, meaning we couldn't obtain the Id for the current app.
   It shouldn't be used on the old architecture.
   */
  @objc
  public var appIdentifier: String? {
    #if RCT_NEW_ARCH_ENABLED
    guard let moduleRegistry = reactBridge?.moduleRegistry else {
      return nil
    }
    return "\(abs(ObjectIdentifier(moduleRegistry).hashValue))"
    #else
    return nil
    #endif
  }

  /**
   Code signing entitlements for code signing
   */
  public let appCodeSignEntitlements = AppContext.modulesProvider().getAppCodeSignEntitlements()

  /**
   The core module that defines the `expo` object in the global scope of Expo runtime.
   */
  internal private(set) lazy var coreModule = CoreModule(appContext: self)

  /**
   The module holder for the core module.
   */
  internal private(set) lazy var coreModuleHolder = ModuleHolder(appContext: self, module: coreModule)

  internal private(set) lazy var converter = MainValueConverter(appContext: self)

  /**
   Designated initializer without modules provider.
   */
  public init(config: AppContextConfig? = nil) {
    self.config = config ?? AppContextConfig(documentDirectory: nil, cacheDirectory: nil, appGroups: appCodeSignEntitlements.appGroups)

    super.init()

    self.moduleRegistry.register(module: JSLoggerModule(appContext: self))
    listenToClientAppNotifications()
  }

  public convenience init(legacyModulesProxy: Any, legacyModuleRegistry: Any, config: AppContextConfig? = nil) {
    self.init(config: config)
    self.legacyModulesProxy = legacyModulesProxy as? LegacyNativeModulesProxy
    self.legacyModuleRegistry = legacyModuleRegistry as? EXModuleRegistry
  }

  @objc
  public convenience override init() {
    self.init(config: nil)
  }

  @objc
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
    return reactBridge?.uiManager.view(forReactTag: NSNumber(value: viewTag)) as? ViewType
  }

  // MARK: - Running on specific queues

  /**
   Runs a code block on the JavaScript thread.
   */
  public func executeOnJavaScriptThread(runBlock: @escaping (() -> Void)) {
    reactBridge?.dispatchBlock(runBlock, queue: RCTJSThread)
  }

  // MARK: - Classes

  internal lazy var sharedObjectRegistry = SharedObjectRegistry(appContext: self)

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
   Provides an event emitter that is compatible with the legacy interface.
   */
  public var eventEmitter: EXEventEmitterService? {
    return LegacyEventEmitterCompat(appContext: self)
  }

  /**
   Starts listening to `UIApplication` notifications.
   */
  private func listenToClientAppNotifications() {
    #if os(iOS) || os(tvOS)
    let notifications = [
      UIApplication.willEnterForegroundNotification,
      UIApplication.didBecomeActiveNotification,
      UIApplication.didEnterBackgroundNotification
    ]
    #elseif os(macOS)
    let notifications = [
      NSApplication.willUnhideNotification,
      NSApplication.didBecomeActiveNotification,
      NSApplication.didHideNotification
    ]
    #endif

    notifications.forEach { name in
      NotificationCenter.default.addObserver(self, selector: #selector(handleClientAppNotification(_:)), name: name, object: nil)
    }
  }

  /**
   Handles app's (`UIApplication`) lifecycle notifications and posts appropriate events to the module registry.
   */
  @objc
  private func handleClientAppNotification(_ notification: Notification) {
    switch notification.name {
    #if os(iOS) || os(tvOS)
    case UIApplication.willEnterForegroundNotification:
      moduleRegistry.post(event: .appEntersForeground)
    case UIApplication.didBecomeActiveNotification:
      moduleRegistry.post(event: .appBecomesActive)
    case UIApplication.didEnterBackgroundNotification:
      moduleRegistry.post(event: .appEntersBackground)
    #elseif os(macOS)
    case NSApplication.willUnhideNotification:
      moduleRegistry.post(event: .appEntersForeground)
    case NSApplication.didBecomeActiveNotification:
      moduleRegistry.post(event: .appBecomesActive)
    case NSApplication.didHideNotification:
      moduleRegistry.post(event: .appEntersBackground)
    #endif
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
    return moduleRegistry.flatMap { holder in
      holder.definition.views.map { key, viewDefinition in
        ViewModuleWrapper(holder, viewDefinition, isDefaultModuleView: key == DEFAULT_MODULE_VIEW)
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
        acc[holder.name] = holder.getLegacyConstants()
      }
  }

  private func viewManagersMetadata() -> [String: Any] {
    return moduleRegistry.reduce(into: [String: Any]()) { acc, holder in
      holder.definition.views.forEach { key, definition in
        let name = key == DEFAULT_MODULE_VIEW ? holder.name : "\(holder.name)_\(definition.name)"
        acc[name] = [
          "propsNames": definition.props.map { $0.name }
        ]
      }
    }
  }

  // MARK: - Runtime

  internal func prepareRuntime() throws {
    let runtime = try runtime
    let coreObject = runtime.createObject()

    coreObject.defineProperty("__expo_app_identifier__", value: appIdentifier, options: [])

    try coreModuleHolder.definition.decorate(object: coreObject, appContext: self)

    // Initialize `global.expo`.
    try runtime.initializeCoreObject(coreObject)

    // Install `global.expo.EventEmitter`.
    EXJavaScriptRuntimeManager.installEventEmitterClass(runtime)

    // Install `global.expo.SharedObject`.
    EXJavaScriptRuntimeManager.installSharedObjectClass(runtime) { [weak sharedObjectRegistry] objectId in
      sharedObjectRegistry?.delete(objectId)
    }
    
    // Install `global.expo.SharedRef`.
    EXJavaScriptRuntimeManager.installSharedRefClass(runtime)

    // Install `global.expo.NativeModule`.
    EXJavaScriptRuntimeManager.installNativeModuleClass(runtime)

    // Install the modules host object as the `global.expo.modules`.
    EXJavaScriptRuntimeManager.installExpoModulesHostObject(self)
  }

  /**
   Unsets runtime objects that we hold for each module.
   */
  private func releaseRuntimeObjects() {
    sharedObjectRegistry.clear()
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
