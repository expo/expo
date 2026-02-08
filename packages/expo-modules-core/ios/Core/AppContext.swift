@preconcurrency import React

/**
 The app context is an interface to a single Expo app.
 */
@objc(EXAppContext)
public final class AppContext: NSObject, @unchecked Sendable {
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
  public weak var legacyModuleRegistry: EXModuleRegistry?

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
   RCTHost wrapper. This is set by ``ExpoReactNativeFactory`` in `didInitializeRuntime`.
   */
  private var hostWrapper: ExpoHostWrapper?

  /**
   Underlying JSI runtime of the running app.
   */
  @objc
  public var _runtime: ExpoRuntime? {
    didSet {
      if _runtime == nil {
        JavaScriptActor.assumeIsolated {
          // When the runtime is unpinned from the context (e.g. deallocated),
          // we should make sure to release all JS objects from the memory.
          // Otherwise the JSCRuntime asserts may fail on deallocation.
          releaseRuntimeObjects()
        }
      } else if _runtime != oldValue {
        JavaScriptActor.assumeIsolated {
          // Try to install the core object automatically when the runtime changes.
          try? prepareRuntime()
        }
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
   Hook for ExpoModulesWorklets to register the UI runtime installer.
   When set, the `installOnUIRuntime` function in CoreModule will use this to create the worklet runtime.
  */
  nonisolated(unsafe) public static var uiRuntimeFactory: ((_ appContext: AppContext, _ pointerValue: JavaScriptValue, _ runtime: JavaScriptRuntime) throws -> JavaScriptRuntime)?

  @objc
  public var _uiRuntime: JavaScriptRuntime? {
    didSet {
      if _uiRuntime != oldValue {
        MainActor.assumeIsolated {
          try? prepareUIRuntime()
        }
      }
    }
  }

  public var uiRuntime: JavaScriptRuntime {
    get throws {
      if let uiRuntime = _uiRuntime {
        return uiRuntime
      }
      throw Exceptions.UIRuntimeLost()
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
  internal private(set) lazy var coreModuleHolder = ModuleHolder(appContext: self, module: coreModule, name: nil)

  internal private(set) lazy var converter = MainValueConverter(appContext: self)

  /**
   Designated initializer without modules provider.
   */
  public init(config: AppContextConfig? = nil) {
    self.config = config ?? AppContextConfig(documentDirectory: nil, cacheDirectory: nil, appGroups: appCodeSignEntitlements.appGroups)

    super.init()

    self.moduleRegistry.register(module: JSLoggerModule(appContext: self), name: nil)
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
    return hostWrapper?.findView(withTag: viewTag) as? ViewType
  }

  // MARK: - Running on specific queues

  /**
   Runs a code block on the JavaScript thread.
   - Warning: This is deprecated, use `appContext.runtime.schedule` instead.
   */
  @available(*, deprecated, renamed: "runtime.schedule")
  public func executeOnJavaScriptThread(_ closure: @JavaScriptActor @escaping () -> Void) {
    _runtime?.schedule(closure)
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
      throw JavaScriptClassNotFoundException()
    }
    let prototype = try jsClass.getProperty("prototype").asObject()
    return try runtime.createObject(withPrototype: prototype)
  }

  // MARK: - Legacy modules

  /**
   Returns a legacy module implementing given protocol/interface.
   */
  public func legacyModule<ModuleProtocol>(implementing moduleProtocol: Protocol) -> ModuleProtocol? {
    return legacyModuleRegistry?.getModuleImplementingProtocol(moduleProtocol) as? ModuleProtocol ?? moduleRegistry.getModule(implementing: ModuleProtocol.self)
  }

  /**
   Provides access to app's constants.
   */
  public lazy var constants: EXConstantsInterface? = ConstantsProvider.shared

  /**
   Provides access to the file system utilities. Can be overridden if the app should use different different directories or file permissions.
   For instance, Expo Go uses sandboxed environment per project where the cache and document directories must be scoped.
   It's an optional type for historical reasons, for now let's keep it like this for backwards compatibility.
   */
  public lazy var fileSystem: FileSystemManager? = FileSystemManager(appGroupSharedDirectories: self.config.appGroupSharedDirectories)

  /**
   Provides access to the permissions manager.
   */
  public lazy var permissions: EXPermissionsService? = EXPermissionsService()

  /**
   Provides access to the image loader from legacy module registry.
   */
  public var imageLoader: EXImageLoaderInterface? {
    guard let loader = hostWrapper?.findModule(withName: "RCTImageLoader", lazilyLoadIfNecessary: true) as? RCTImageLoader else {
      log.warn("Unable to get the RCTImageLoader module.")
      return nil
    }
    return ImageLoader(rctImageLoader: loader)
  }

  /**
   Provides access to the utilities (such as looking up for the current view controller).
   */
  public var utilities: Utilities? = Utilities()

  /**
   Provides an event emitter that is compatible with the legacy interface.
   - Deprecated as of Expo SDK 55. May be removed in the future releases.
   */
  @available(*, deprecated, message: "Use `sendEvent` directly on the module instance instead")
  public var eventEmitter: LegacyEventEmitterCompat? {
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
  @JavaScriptActor
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

  // MARK: - Modules registration

  /**
   Registers native modules provided by generated `ExpoModulesProvider`.
   */
  @objc
  public func registerNativeModules() {
    registerNativeModules(provider: Self.modulesProvider())
  }

  /**
   Registers native modules provided by given provider.
   */
  @objc
  public func registerNativeModules(provider: ModulesProvider) {
    useModulesProvider(provider)

    // TODO: Make `registerNativeViews` thread-safe
    if Thread.isMainThread {
      MainActor.assumeIsolated {
        self.registerNativeViews()
      }
    } else {
      Task { @MainActor [weak self] in
        self?.registerNativeViews()
      }
    }
  }

  /**
   Registers native views defined by registered native modules.
   - Note: It should stay private as `registerNativeModules` should be the only call site. Works only with the New Architecture.
   - Todo: `RCTComponentViewFactory` is thread-safe, so this function should be as well.
   */
  @MainActor
  private func registerNativeViews() {
#if RCT_NEW_ARCH_ENABLED
    for holder in moduleRegistry {
      for (key, viewDefinition) in holder.definition.views {
        let viewModule = ViewModuleWrapper(holder, viewDefinition, isDefaultModuleView: key == DEFAULT_MODULE_VIEW)
        ExpoFabricView.registerComponent(viewModule, appContext: self)
      }
    }
#endif
  }

  // MARK: - Runtime

  @JavaScriptActor
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

  @MainActor
  internal func prepareUIRuntime() throws {
    let uiRuntime = try uiRuntime
    let coreObject = uiRuntime.createObject()

    // Initialize `global.expo`.
    uiRuntime.global().defineProperty(EXGlobalCoreObjectPropertyName, value: coreObject, options: .enumerable)

    // Install `global.expo.EventEmitter`.
    EXJavaScriptRuntimeManager.installEventEmitterClass(uiRuntime)

    // Install `global.expo.NativeModule`.
    EXJavaScriptRuntimeManager.installNativeModuleClass(uiRuntime)
  }

  /**
   Unsets runtime objects that we hold for each module.
   */
  @JavaScriptActor
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

  @objc
  public func setHostWrapper(_ wrapper: ExpoHostWrapper) {
    self.hostWrapper = wrapper
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

    // [2] Fallback to search for `ExpoModulesProvider` in frameworks (brownfield use case)
    for bundle in Bundle.allFrameworks {
      guard let bundleName = bundle.infoDictionary?["CFBundleName"] as? String else { continue }
      if let providerClass = NSClassFromString("\(bundleName).\(providerName)") as? ModulesProvider.Type {
        return providerClass.init()
      }
    }

    // [3] Fallback to an empty `ModulesProvider` if `ExpoModulesProvider` was not generated
    return ModulesProvider()
  }

  public func reloadAppAsync(_ reason: String = "Reload from appContext") {
    if moduleRegistry.has(moduleWithName: "ExpoGo") {
      NotificationCenter.default.post(name: NSNotification.Name(rawValue: "EXReloadActiveAppRequest"), object: nil)
    } else {
      DispatchQueue.main.async {
        RCTTriggerReloadCommandListeners(reason)
      }
    }
  }
}

// MARK: - Public exceptions

public class JavaScriptClassNotFoundException: Exception, @unchecked Sendable {
  public override var reason: String {
    "Unable to find a JavaScript class in the class registry"
  }
}

// Deprecated since v1.0.0
@available(*, deprecated, renamed: "Exceptions.AppContextLost")
public typealias AppContextLostException = Exceptions.AppContextLost

// Deprecated since v1.0.0
@available(*, deprecated, renamed: "Exceptions.RuntimeLost")
public typealias RuntimeLostException = Exceptions.RuntimeLost
