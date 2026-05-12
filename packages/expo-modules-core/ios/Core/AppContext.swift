@preconcurrency internal import React
import ExpoModulesJSI

/**
 The app context is an interface to a single Expo app.
 */
@objc(EXAppContext)
public final class AppContext: NSObject, EXAppContextProtocol, @unchecked Sendable {
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

  /**
   React bridge of the context's app. Can be `nil` when the bridge
   hasn't been propagated to the bridge modules yet,
   or when the app context is "bridgeless" (for example in native unit tests).
   */
  @objc
  internal weak var reactBridge: RCTBridge?

  /**
   RCTHost wrapper. This is set by ``ExpoReactNativeFactory`` in `didInitializeRuntime`.
   */
  private var hostWrapper: ExpoHostWrapper?

  /**
   Underlying JSI runtime of the running app.
   */
  private var _runtime: ExpoRuntime? {
    didSet {
      if _runtime == nil && oldValue != nil {
        destroy()
        return
      }
      if _runtime != nil && _runtime != oldValue {
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

  public typealias UIRuntimeFactory = (
    _ appContext: AppContext,
    _ pointerValue: JavaScriptValue,
    _ runtime: JavaScriptRuntime
  ) throws -> JavaScriptRuntime

  /**
   Hook for ExpoModulesWorklets to register the UI runtime installer.
   When set, the `installOnUIRuntime` function in CoreModule will use this to create the worklet runtime.
  */
  nonisolated(unsafe) public static var uiRuntimeFactory: UIRuntimeFactory?

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
    guard let moduleRegistry = reactBridge?.moduleRegistry else {
      return nil
    }
    return "\(abs(ObjectIdentifier(moduleRegistry).hashValue))"
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

  internal var converter: MainValueConverter {
    // MainValueConverter is ~Copyable so it can't be stored in a lazy var (which uses Optional internally).
    // This is zero-cost at runtime — the struct contains only an unowned pointer to self, so constructing
    // it is a single pointer store with no allocations, reference counting, or weak-ref side table work.
    return MainValueConverter(appContext: self)
  }

  /**
   Designated initializer without modules provider.
   */
  public init(config: AppContextConfig? = nil) {
    self.config = config ?? AppContextConfig(documentDirectory: nil, cacheDirectory: nil, appGroups: appCodeSignEntitlements.appGroups)

    super.init()

    self.moduleRegistry.register(module: JSLoggerModule(appContext: self), name: nil)
    listenToClientAppNotifications()
  }

  public convenience init(legacyModuleRegistry: Any, config: AppContextConfig? = nil) {
    self.init(config: config)
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

  /**
   Looks up a view by its React tag. Ensures the lookup runs on the main thread.
   */
  public func findView<ViewType>(withTag viewTag: Int, ofType type: ViewType.Type) -> ViewType? {
    // TODO: Migrate to @MainActor to get compile-time thread safety instead of runtime dispatch
    return performSynchronouslyOnMainThread {
      return hostWrapper?.findView(withTag: viewTag) as? ViewType
    }
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
    return try JavaScriptActor.assumeIsolated {
      let prototype = try jsClass.getProperty("prototype").asObject()
      return try runtime.createObject(prototype: prototype)
    }
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
   Provides access to a native React Native module by name.
   In new arch the lookup goes through the host wrapper; in old arch through the bridge.
   */
  public func nativeModule<T>(named name: String) -> T? {
    guard let module = hostWrapper?.findModule(withName: name, lazilyLoadIfNecessary: true) as? T else {
      log.warn("Unable to get the \(name) module.")
      return nil
    }
    return module
  }

  /**
   The bundle URL of the running React Native app.
   Resolved from RCTBundleManager via RCTHost.
   */
  public var bundleURL: URL? {
    return hostWrapper?.bundleURL()
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
  public func getNativeModuleObject(_ moduleName: String) -> JavaScriptValue? {
    return moduleRegistry.get(moduleHolderForName: moduleName)?.getJavaScriptValue()
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
   - Note: It should stay private as `registerNativeModules` should be the only call site.
   - Todo: `RCTComponentViewFactory` is thread-safe, so this function should be as well.
   */
  @MainActor
  private func registerNativeViews() {
    for holder in moduleRegistry {
      for (key, viewDefinition) in holder.definition.views {
        let viewModule = ViewModuleWrapper(holder, viewDefinition, isDefaultModuleView: key == DEFAULT_MODULE_VIEW)
        ExpoFabricView.registerComponent(viewModule, appContext: self)
      }
    }
  }

  // MARK: - Runtime

  /**
   Sets the JavaScript runtime from raw pointers. Called by `ExpoReactNativeFactory`
   when React Native initializes the runtime. When `scheduler` and `dispatch`
   are both provided, `JavaScriptRuntime.schedule(...)` / `.execute(...)` dispatch
   onto the JS thread through them. When either is `nil`, the runtime falls back
   to a synchronous no-op scheduler — callers can detect this via
   `JavaScriptRuntime.supportsAsyncScheduling`.

   `dispatch` is a raw pointer to a C function with signature
   `void (*)(void *scheduler, int priority, void (^callback)())` — cast back
   to the typed pointer inside `ExpoModulesJSI`. It's typed as `UnsafeRawPointer`
   here rather than `@convention(c)` so the symbol can cross the Objective-C
   bridge without needing a Swift-typed entry point.
   */
  @objc
  public func setRuntime(
    _ runtimePointer: UnsafeMutableRawPointer,
    scheduler: UnsafeMutableRawPointer?,
    dispatch: UnsafeRawPointer?
  ) {
    if let scheduler, let dispatch {
      _runtime = ExpoRuntime(
        unsafePointer: runtimePointer,
        scheduler: scheduler,
        dispatch: dispatch
      )
    } else {
      _runtime = ExpoRuntime(unsafePointer: runtimePointer)
    }
  }

  @JavaScriptActor
  internal func prepareRuntime() throws {
    let installer = ExpoRuntimeInstaller(appContext: self, runtime: try runtime)

    // Install `global.expo`.
    let coreObject = installer.installCoreObject()

    if let appIdentifier {
      coreObject.defineProperty("__expo_app_identifier__", value: appIdentifier)
    }

    try coreModuleHolder.definition.decorate(object: coreObject, appContext: self)

    // Install `global.expo.EventEmitter`.
    installer.installEventEmitterClass()

    // Install `global.expo.SharedObject`.
    installer.installSharedObjectClass() { [weak sharedObjectRegistry] objectId in
      sharedObjectRegistry?.delete(objectId)
    }

    // Install `global.expo.SharedRef`.
    installer.installSharedRefClass()

    // Install `global.expo.NativeModule`.
    installer.installNativeModuleClass()

    // Install the modules host object as the `global.expo.modules`.
    try installer.installExpoModulesHostObject()
  }

  @MainActor
  internal func prepareUIRuntime() throws {
    // This function is @MainActor, but the installer APIs require @JavaScriptActor.
    // Safe here because the UI runtime runs its JS on the main thread, which
    // JavaScriptActor accepts as a valid isolated context.
    try JavaScriptActor.assumeIsolated {
      let installer = ExpoRuntimeInstaller(appContext: self, runtime: try uiRuntime)

      // Install `global.expo`.
      installer.installCoreObject()

      // Install `global.expo.EventEmitter`.
      installer.installEventEmitterClass()

      // Install `global.expo.SharedObject`.
      installer.installSharedObjectClass() { [weak sharedObjectRegistry] objectId in
        sharedObjectRegistry?.delete(objectId)
      }

      // Install `global.expo.SharedRef`.
      installer.installSharedRefClass()

      // Install `global.expo.NativeModule`.
      installer.installNativeModuleClass()

      // Install the modules host object as the `global.expo.modules`.
      try installer.installExpoModulesHostObject()

      // Install module class prototypes so SharedObject properties are accessible in worklets.
      try installModuleClasses(in: uiRuntime)
    }
  }

  /**
   Installs SharedObject class prototypes with property getter/setters in the given runtime.
   Also installs `SharedObject.__resolveInWorklet(objectId)` for resolving the original native object instance in worklets.
   */
  @JavaScriptActor
  private func installModuleClasses(in runtime: JavaScriptRuntime) throws {
    let coreObject = runtime.global().getPropertyAsObject(EXGlobalCoreObjectPropertyName)
    let sharedObjectClass = coreObject.getPropertyAsObject("SharedObject")
    let sharedObjectBaseProto = sharedObjectClass.getProperty("prototype")

    // Stored as JavaScriptValue (a class) because JavaScriptObject is ~Copyable
    // and cannot be a Dictionary value.
    let prototypeCache = WorkletPrototypeCache()

    // Called by the worklet serializer's `unpack` to recreate a SharedObject proxy.
    // Takes just the objectId — looks up the native type, lazily builds the prototype on first use.
    let resolveInWorklet = runtime.createFunction("__resolveInWorklet") { [weak self] _, arguments in
      guard let self else {
        throw Exceptions.AppContextLost()
      }
      let objectId = try arguments[0].asInt()

      guard let nativeObject = self.sharedObjectRegistry.get(objectId)?.native else {
        throw SharedObjectNotFoundException(String(objectId))
      }

      let typeId = ObjectIdentifier(type(of: nativeObject))
      let instance: JavaScriptObject

      if let cachedPrototype = prototypeCache.store[typeId] {
        instance = runtime.createObject(prototype: cachedPrototype.getObject())
      } else {
        guard let classDefinition = self.findClassDefinition(for: typeId) else {
          throw SharedObjectClassNotRegisteredException(String(describing: type(of: nativeObject)))
        }
        let built = try classDefinition.buildPrototype(
          in: runtime,
          appContext: self,
          basePrototype: sharedObjectBaseProto.getObject()
        )
        prototypeCache.store[typeId] = built.asValue()
        instance = runtime.createObject(prototype: built)
      }

      instance.defineProperty(sharedObjectIdPropertyName, value: objectId, options: [])
      return instance.asValue()
    }

    sharedObjectClass.setProperty("__resolveInWorklet", value: resolveInWorklet.asObject())
  }

  /**
   Finds the ClassDefinition for a given native type identifier by searching all modules.
   */
  private func findClassDefinition(for typeId: ObjectIdentifier) -> ClassDefinition? {
    for module in moduleRegistry {
      for (_, classDefinition) in module.definition.classes {
        if let sharedObjectType = classDefinition.associatedType as? DynamicSharedObjectType,
           sharedObjectType.typeIdentifier == typeId {
          return classDefinition
        }
      }
    }
    return nil
  }

  /**
   Unsets runtime objects that we hold for each module.
   */
  @JavaScriptActor
  private func releaseRuntimeObjects() {
    sharedObjectRegistry.clear()
    classRegistry.clear()

    for module in moduleRegistry {
      module.releaseJavaScriptObject()
    }
  }

  // MARK: - Deallocation

  @objc
  public func destroy() {
    JavaScriptActor.assumeIsolated {
      // When the runtime is unpinned from the context (e.g. deallocated),
      // we should make sure to release all JS objects from the memory.
      // Otherwise the JSCRuntime asserts may fail on deallocation.
      releaseRuntimeObjects()
    }
    _runtime = nil
  }

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

/**
 Reference-type store for cached worklet prototypes. Needed because JavaScriptObject
 is ~Copyable and cannot be stored in a Dictionary; we cache via JavaScriptValue
 (a class) and rehydrate a JavaScriptObject on use.
 */
@JavaScriptActor
private final class WorkletPrototypeCache {
  var store: [ObjectIdentifier: JavaScriptValue] = [:]
}

// MARK: - Public exceptions

public class JavaScriptClassNotFoundException: Exception, @unchecked Sendable {
  public override var reason: String {
    "Unable to find a JavaScript class in the class registry"
  }
}

internal final class SharedObjectNotFoundException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "SharedObject with id '\(param)' not found in the registry"
  }
}

internal final class SharedObjectClassNotRegisteredException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "No class definition registered for SharedObject type '\(param)'"
  }
}

// Deprecated since v1.0.0
@available(*, deprecated, renamed: "Exceptions.AppContextLost")
public typealias AppContextLostException = Exceptions.AppContextLost

// Deprecated since v1.0.0
@available(*, deprecated, renamed: "Exceptions.RuntimeLost")
public typealias RuntimeLostException = Exceptions.RuntimeLost
