@preconcurrency internal import React
import ExpoModulesJSI

/**
 The app context is an interface to a single Expo app.
 Not `final` so that `TestAppContext` from `ExpoModulesTestCore` can subclass it.
 */
@objc(EXAppContext)
public class AppContext: NSObject, EXAppContextProtocol, @unchecked Sendable {
  internal static func create() -> AppContext {
    let appContext = AppContext()

    appContext.ownsRuntime = true
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
   The registry of the packages that back `expo.packages`. It's independent of `moduleRegistry`,
   but a module that is in both has one holder.
   */
  internal private(set) lazy var packageRegistry: PackageRegistry = {
    isPackageRegistryInitialized = true
    return PackageRegistry(appContext: self)
  }()

  /**
   Whether the package registry for this app context has already been initialized.
   */
  private var isPackageRegistryInitialized: Bool = false

  /**
   The holders of the modules in `moduleRegistry` and of the modules that are only in `packageRegistry`,
   each holder once. It doesn't create a registry that isn't created yet.
   */
  internal var allModuleHolders: [ModuleHolder] {
    var holders = isModuleRegistryInitialized ? Array(moduleRegistry) : []
    guard isPackageRegistryInitialized else {
      return holders
    }
    var seenHolders = Set(holders.map(ObjectIdentifier.init))
    for holder in packageRegistry.moduleHolders where seenHolders.insert(ObjectIdentifier(holder)).inserted {
      holders.append(holder)
    }
    return holders
  }

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

  /// Observes the surface presenter of the host to know when the views of this app context are created.
  private var surfacePresenterObserver: SurfacePresenterObserver?

  /**
   Whether the app context owns its runtime, as the one from `create()` and `TestAppContext` do,
   rather than React Native. The `global.expo` native state then doesn't pin the app context (see
   ``NativeState``): nothing else tears that runtime down, so the pin would be a cycle that keeps
   both alive forever. Set it before the runtime.
   */
  internal var ownsRuntime = false {
    willSet {
      assert(_runtime == nil, "Set ownsRuntime before the runtime: the global.expo native state reads it only once")
    }
  }

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
    _ pointerValue: borrowing JavaScriptValue,
    _ runtime: JavaScriptRuntime
  ) throws -> JavaScriptRuntime

  /**
   Hook for ExpoModulesWorklets to register the UI runtime installer.
   When set, the `installOnUIRuntime` function in CoreModule will use this to create the worklet runtime.
  */
  nonisolated(unsafe) public static var uiRuntimeFactory: UIRuntimeFactory?

  /// Finds the worklets UI runtime of a holder that `react-native-worklets` returns in `runtime`, with JSI calls only on
  /// `runtime`. Returns a function that makes the wrapper of the UI runtime on the main thread while it holds the lock of
  /// the UI runtime, or `nil` when the holder has no UI runtime. The function returns `nil` when the UI runtime is gone.
  @_spi(Internal)
  public typealias UIRuntimeLocator = (
    _ holder: borrowing JavaScriptValue,
    _ runtime: JavaScriptRuntime
  ) -> (@Sendable () -> JavaScriptRuntime?)?

  /// Set by `ExpoModulesWorklets`, like ``uiRuntimeFactory``.
  @_spi(Internal)
  nonisolated(unsafe) public static var uiRuntimeLocator: UIRuntimeLocator?

  public var _uiRuntime: JavaScriptRuntime?

  /// The wrapper of the worklets UI runtime, with or without Expo installed on it. `installOnUIRuntime` and the lookup
  /// for the props of v2 views make it on the main thread and share it: a second wrapper would replace the first one in
  /// the runtime registry.
  internal let workletsUIRuntime = Mutex<JavaScriptRuntime?>(nil)

  public var uiRuntime: JavaScriptRuntime {
    get throws {
      if let uiRuntime = _uiRuntime {
        return uiRuntime
      }
      throw Exceptions.UIRuntimeLost()
    }
  }

  /// The number of app contexts created so far in this process.
  private static let appContextsCount = Mutex<Int>(0)

  /// The position of this app context in creation order, starting at 0.
  internal let appIndex: Int = AppContext.appContextsCount.withLock { count in
    defer {
      count += 1
    }
    return count
  }

  /// The application identifier that distinguishes app contexts that are alive at the same time,
  /// for example during a reload or when more than one `RCTHost` is running. It's `nil` for the first
  /// app context.
  @objc
  public var appIdentifier: String? {
    return AppContext.appIdentifier(forIndex: appIndex)
  }

  internal static func appIdentifier(forIndex index: Int) -> String? {
    if index == 0 {
      return nil
    }
    return String(index)
  }

  /**
   Code signing entitlements for code signing
   */
  public let appCodeSignEntitlements = AppContext.modulesProvider().getAppCodeSignEntitlements()

  /**
   The core module that defines the `expo` object in the global scope of Expo runtime.
   */
  internal private(set) lazy var coreModule = CoreModule(appContext: self)

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
    packageRegistry.register(fromProvider: provider)
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

  /// A registry containing references to the prototypes of JavaScript classes.
  /// - ToDo: Make one registry per module, not the entire app context.
  /// Perhaps it should be kept by the `ModuleHolder`.
  internal let classRegistry = ClassRegistry()

  /// Creates a new JavaScript object with the class prototype associated with the given native class.
  /// Returns `nil` when the native class has no JavaScript class.
  /// - ToDo: Move this to `ModuleHolder` along the `classRegistry` property.
  internal func newObject(of type: any AnyJavaScriptClass.Type) throws -> JavaScriptObject? {
    let runtime = try self.runtime
    let nativeClassId = ObjectIdentifier(type)
    if let object = classRegistry.withPrototype(nativeClassId: nativeClassId, { (prototype: borrowing JavaScriptObject) in
      return runtime.createObject(prototype: prototype)
    }) {
      return object
    }
    // A class that a package exports is built when JS reads it first, and a class with its own JS class that no module
    // registers is built when it is first needed. Build it now, because a native instance gets to JS before that.
    guard type.hasOwnJSClass || packageRegistry.sharedObjectType(for: nativeClassId) != nil else {
      // A class without the `@SharedObject` macro gets the class of its nearest superclass with the macro, as it does
      // in the other runtimes.
      if let classType = type._jsClassType {
        return try newObject(of: classType)
      }
      return nil
    }
    // Native values are converted to JS on the JavaScript thread.
    return try JavaScriptActor.assumeIsolated {
      // Building the class registers its prototype in `classRegistry`.
      _ = try JavaScriptBindings.buildClass(type, appContext: self)
      return classRegistry.withPrototype(nativeClassId: nativeClassId) { (prototype: borrowing JavaScriptObject) in
        return runtime.createObject(prototype: prototype)
      }
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

  // Created on first access, like a `lazy var`, but under a lock: concurrent functions can read it on several threads at once.
  private let fileSystemStorage = Mutex<FileSystemManager?>(nil)

  /**
   Provides access to the file system utilities. Can be overridden if the app should use different directories or file permissions.
   For instance, Expo Go uses sandboxed environment per project where the cache and document directories must be scoped.
   It's an optional type for historical reasons, for now let's keep it like this for backwards compatibility.
   */
  public var fileSystem: FileSystemManager? {
    get {
      fileSystemStorage.withLock { stored in
        if let stored {
          return stored
        }
        let fileSystem = FileSystemManager(appGroupSharedDirectories: config.appGroupSharedDirectories)
        stored = fileSystem
        return fileSystem
      }
    }
    set { fileSystemStorage.withLock { $0 = newValue } }
  }

  /**
   Provides access to the permissions manager.
   */
  public var permissions: EXPermissionsService? = EXPermissionsService()

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
   Posts the event to the modules of both registries, each module once.
   */
  private func postToModules(event: EventName) {
    for holder in allModuleHolders {
      holder.post(event: event)
    }
  }

  /**
   Handles app's (`UIApplication`) lifecycle notifications and posts appropriate events to the modules.
   */
  @objc
  private func handleClientAppNotification(_ notification: Notification) {
    switch notification.name {
    #if os(iOS) || os(tvOS)
    case UIApplication.willEnterForegroundNotification:
      postToModules(event: .appEntersForeground)
    case UIApplication.didBecomeActiveNotification:
      postToModules(event: .appBecomesActive)
    case UIApplication.didEnterBackgroundNotification:
      postToModules(event: .appEntersBackground)
    #elseif os(macOS)
    case NSApplication.willUnhideNotification:
      postToModules(event: .appEntersForeground)
    case NSApplication.didBecomeActiveNotification:
      postToModules(event: .appBecomesActive)
    case NSApplication.didHideNotification:
      postToModules(event: .appEntersBackground)
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

  /**
   Returns the package with the given name that backs `expo.packages[packageName]`, or `nil` when it isn't registered.
   */
  func package(named packageName: String) -> PackageHolder? {
    return packageRegistry.package(named: packageName)
  }

  /**
   Returns the JavaScript class of the given `@SharedObject` or `@JSClass` class, and builds it on the first call.
   There is one class for each native type, so a class that a package exports and a module registers in
   `_classTypes` too is the same object in both places.
   */
  @JavaScriptActor
  func getJavaScriptClass(_ type: any AnyJavaScriptClass.Type) throws -> JavaScriptObject {
    let cachedClass = classRegistry.withPrototype(nativeClassId: ObjectIdentifier(type)) {
      (prototype: borrowing JavaScriptObject) in
      return prototype.getProperty("constructor").getObject()
    }
    if let cachedClass {
      return cachedClass
    }
    return try JavaScriptBindings.buildClass(type, appContext: self)
  }

  /**
   Returns a JavaScript object that represents a module with given name in a runtime attached with `attach(runtime:)`.
   */
  @JavaScriptActor
  internal func getNativeModuleObject(_ moduleName: String, inAttachedRuntime runtime: JavaScriptRuntime) -> JavaScriptValue? {
    return moduleRegistry.get(moduleHolderForName: moduleName)?.getJavaScriptValue(inAttachedRuntime: runtime)
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
    for holder in allModuleHolders {
      // Views of Expo Modules v1, declared with `View` in the module definition.
      for viewName in holder.definition.views.keys {
        ExpoFabricView.registerComponent(moduleName: holder.name, viewName: viewName)
      }
      // Views of Expo Modules v2, the `@ExpoView` classes in `@ExpoModule(views:)`. The default view is also under its
      // own name, and a class can be one component only. The named views are registered first, so the named
      // component always gets the class, and the default view gets a subclass.
      for (viewName, viewType) in holder.nativeViewTypes where viewName != DEFAULT_MODULE_VIEW {
        ExpoNativeView.registerComponent(
          viewType,
          componentName: ExpoFabricView.componentName(moduleName: holder.name, viewName: viewName)
        )
      }
      if let defaultViewType = holder.nativeViewTypes[DEFAULT_MODULE_VIEW] {
        ExpoNativeView.registerComponent(
          defaultViewType,
          componentName: ExpoFabricView.componentName(moduleName: holder.name, viewName: DEFAULT_MODULE_VIEW)
        )
      }
    }
    // Views of Expo Modules v2 that packages export, the `@ExpoView` classes in `ExpoPackage.views`.
    if isPackageRegistryInitialized {
      for (packageName, viewType) in packageRegistry.views {
        ExpoNativeView.registerComponent(
          viewType,
          componentName: ExpoNativeView.packageComponentName(packageName: packageName, viewName: viewType._jsName)
        )
      }
    }
    AppContext.viewsRegisteringAppContext = self
  }

  // MARK: - Mounting views

  /// The app context whose host is mounting views right now. It's set by `SurfacePresenterObserver`.
  @MainActor
  internal static weak var mountingAppContext: AppContext?

  /// The app context that registered native views most recently. Views are created for this context
  /// when no host is mounting, for example when the host isn't wrapped by `ExpoHostWrapper`.
  @MainActor
  internal static weak var viewsRegisteringAppContext: AppContext?

  /// The app context that the views being created belong to. Component view classes are shared by all app contexts,
  /// so this is how the views get their app context.
  @MainActor
  internal static var appContextForNewViews: AppContext? {
    return mountingAppContext ?? viewsRegisteringAppContext
  }

  /// Starts observing the surface presenter of the host, so the views created while the host is mounting
  /// get this app context.
  @MainActor
  private func observeMounting(with hostWrapper: ExpoHostWrapper) {
    guard let surfacePresenter = hostWrapper.surfacePresenter() else {
      log.warn("The host has no surface presenter, so its views are created for the app context that registered views last")
      return
    }
    let observer = SurfacePresenterObserver(appContext: self)
    if observer.observe(surfacePresenter) {
      surfacePresenterObserver = observer
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

   `scheduler` is an opaque handle that `dispatch` understands; the factories pass
   a handle created by `expo::createReactSchedulerHandle` that references the React
   runtime scheduler weakly (see `EXReactSchedulerDispatch.h`).

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
    try prepare(runtime: try runtime, isMainRuntime: true)
  }

  /**
   Prepares another runtime to use this app context, next to the main runtime, for example the
   worklet UI runtime or a second runtime in tests. Call it on the thread of that runtime.
   The runtime doesn't own the app context's lifecycle: tearing it down doesn't destroy the app context.
   Attaching a runtime that is already attached to this app context does nothing.
   */
  @JavaScriptActor
  public func attach(runtime: JavaScriptRuntime) throws {
    // `global.expo` can't be replaced, so a runtime that has it can't be prepared again. It can also belong to
    // an app context that was released, in which case `AppContext.from(runtime:)` returns `nil`.
    if runtime.global().hasProperty(globalCoreObjectPropertyName) {
      guard AppContext.from(runtime: runtime) === self else {
        throw RuntimeAttachedToAnotherAppContextException()
      }
      return
    }
    try prepare(runtime: runtime, isMainRuntime: false)
  }

  @JavaScriptActor
  private func prepare(runtime: JavaScriptRuntime, isMainRuntime: Bool) throws {
    let installer = ExpoRuntimeInstaller(appContext: self, runtime: runtime)

    // Install `global.expo`.
    let coreObject = installer.installCoreObject()

    // Attach the native state that ties this app context's lifetime to the runtime and lets
    // it be recovered from the runtime via `AppContext.from(runtime:)`. Only the teardown of
    // the main runtime runs the app context's `destroy()`.
    installer.installAppContextNativeState(on: coreObject, ownsLifecycle: isMainRuntime)

    if isMainRuntime {
      // The main runtime is prepared on its own thread, which decodes the props of v2 views that come without a
      // runtime there, for example from Reanimated's commit hook during a React commit. The main runtime also
      // finds the worklets UI runtime, which decodes them on the main thread.
      ViewPropsRuntimes.registerForCurrentThread(runtime)
      ViewPropsRuntimes.addAppContext(self, mainRuntime: runtime)
    }

    // Bind the `@JS` members of the core module.
    try coreModule._decorateModule(object: coreObject, in: runtime)

    // Install `global.expo.EventEmitter`.
    let eventEmitterClass = try EventEmitterMethods.installClass(on: coreObject, in: runtime)

    // Install `global.expo.SharedObject`.
    let sharedObjectClass = try SharedObject.installBaseClass(
      on: coreObject,
      inheriting: eventEmitterClass.asValue().getFunction(),
      in: runtime
    ) { [weak sharedObjectRegistry] objectId in
      sharedObjectRegistry?.release(objectId, inMainRuntime: isMainRuntime)
    }

    // Install `global.expo.SharedRef`.
    try installer.installSharedRefClass(on: coreObject, inheriting: sharedObjectClass)

    // Install `global.expo.NativeModule`.
    try installer.installNativeModuleClass(on: coreObject, inheriting: eventEmitterClass)

    // Install the modules host object as the `global.expo.modules`.
    try installer.installExpoModulesHostObject(isMainRuntime: isMainRuntime)

    // Install the packages host object as the `global.expo.packages`.
    try installer.installExpoPackagesHostObject()

    // Install `global.expo.SharedObject.__resolveInWorklet`.
    try installSharedObjectResolver(in: runtime, isMainRuntime: isMainRuntime)
  }

  /**
   Installs `SharedObject.__resolveInWorklet(objectId)`, which the worklets serializer calls to get the JS object of a
   shared object in the runtime that unpacks it: an attached runtime for a worklet, or the main runtime for a value that
   a worklet passes back with `runOnJS`.
   */
  @JavaScriptActor
  private func installSharedObjectResolver(in runtime: JavaScriptRuntime, isMainRuntime: Bool) throws {
    let sharedObjectClass = try runtime.global()
      .getPropertyAsObject(globalCoreObjectPropertyName)
      .getPropertyAsObject("SharedObject")

    // The function gets the runtime as an argument, because capturing it would keep a runtime that owns its
    // engine alive forever.
    let resolveInWorklet = runtime.createFunction("__resolveInWorklet") {
      [weak self] (
        _: borrowing JavaScriptUnownedValue,
        arguments: consuming JavaScriptValuesBuffer,
        result: borrowing JavaScriptValue.Slot,
        runtime: borrowing JavaScriptRuntime
      ) in
      guard let self else {
        throw Exceptions.AppContextLost()
      }
      let runtime = copy runtime
      let objectId = try arguments[0].asInt()

      guard let nativeState = self.sharedObjectRegistry.get(objectId), !nativeState.isReleased else {
        throw SharedObjectNotFoundException(String(objectId))
      }
      if isMainRuntime {
        result.emplace(try self.mainRuntimeObject(for: nativeState, in: runtime).asValue())
        return
      }
      let nativeType = type(of: nativeState.native)
      let instance = try nativeState.javaScriptObject(in: runtime) {
        return try self.newSharedObjectInstance(of: nativeType, in: runtime)
      }
      guard let instance else {
        throw SharedObjectNotFoundException(String(objectId))
      }
      result.emplace(instance.asValue())
    }

    sharedObjectClass.setProperty("__resolveInWorklet", value: resolveInWorklet.asObject())
  }

  /// Returns the JS object of the shared object in the main runtime. When that JS object was collected, for example
  /// while a worklet still has one, it pairs a new JS object with the same native state and ID.
  @JavaScriptActor
  private func mainRuntimeObject(for nativeState: SharedObjectNativeState, in runtime: JavaScriptRuntime) throws -> JavaScriptObject {
    if let jsObject = nativeState.javaScriptObject(in: runtime) {
      return jsObject
    }
    let native = nativeState.native
    // The native object was paired again with a new native state and ID after this one was released.
    guard native.nativeState === nativeState else {
      throw SharedObjectNotFoundException(String(native.sharedObjectId))
    }
    let nativeType = type(of: native)
    let jsObject =
      try newObject(of: nativeType)
      ?? (try self.runtime).createBaseSharedObject(isSharedRef: nativeType is AnySharedRef.Type)
    sharedObjectRegistry.add(native: native, javaScript: jsObject, inheritsBaseClass: true, in: runtime)
    return jsObject
  }

  /// Returns the JS object of the shared object in the given runtime, a runtime other than the main runtime, and
  /// creates one when there is none.
  @JavaScriptActor
  internal func javaScriptObject(for sharedObject: SharedObject, in runtime: JavaScriptRuntime) throws -> JavaScriptObject {
    if let jsObject = sharedObject.object(in: runtime) {
      return jsObject
    }
    let jsObject = try newSharedObjectInstance(of: type(of: sharedObject), in: runtime)
    sharedObjectRegistry.add(native: sharedObject, javaScript: jsObject, inheritsBaseClass: true, in: runtime)
    return jsObject
  }

  /// Creates a JS object with the prototype of the shared object class in the given runtime, a runtime other than
  /// the main runtime. Not paired yet.
  @JavaScriptActor
  private func newSharedObjectInstance(of nativeType: SharedObject.Type, in runtime: JavaScriptRuntime) throws -> JavaScriptObject {
    let prototypes = runtime.cached(sharedObjectPrototypesCacheKey, SharedObjectPrototypes.init)
    let typeId = ObjectIdentifier(nativeType)

    if let instance = prototypes.instancePrototypes[typeId]?.withUnwrappedValue({ (prototype: borrowing JavaScriptObject) in
      runtime.createObject(prototype: prototype)
    }) {
      return instance
    }
    let prototype = try instancePrototype(for: nativeType, in: runtime, prototypes: prototypes)
    let instance = runtime.createObject(prototype: prototype)
    prototypes.instancePrototypes[typeId] = prototype.ref()
    return instance
  }

  /// Returns the prototype for an instance of a native shared object class in a runtime other than the main runtime:
  /// the prototype of the class itself or of its nearest superclass that has a JS class. A module defines that class
  /// with a `ClassDefinition` or registers it in `_classTypes`, a package exports it, or the `@SharedObject` macro gives
  /// it its own class. A subclass without a JS class gets the prototype of that superclass, because a function that
  /// declares the superclass as its return type gives it that class in the main runtime. Returns the base prototype
  /// when none of these classes has a JS class, as the main runtime does.
  @JavaScriptActor
  private func instancePrototype(
    for nativeType: SharedObject.Type,
    in runtime: JavaScriptRuntime,
    prototypes: SharedObjectPrototypes
  ) throws -> JavaScriptObject {
    var type: SharedObject.Type? = nativeType

    while let currentType = type {
      let typeId = ObjectIdentifier(currentType)

      if currentType.hasOwnJSClass || findClassDefinition(for: typeId) != nil || findClassType(for: typeId) != nil {
        return try classPrototype(for: currentType, in: runtime, prototypes: prototypes)
      }
      type = class_getSuperclass(currentType) as? SharedObject.Type
    }
    return try basePrototype(for: nativeType, in: runtime)
  }

  /// Returns the prototype of the JS class of a native shared object class in a runtime other than the main runtime,
  /// and builds it on the first call. It extends the prototype of `resolvedJSSuperclassType`, built the same way, or
  /// the base prototype. Like in the main runtime, a superclass gets a prototype also when no module registers it.
  @JavaScriptActor
  private func classPrototype(
    for type: any AnyJavaScriptClass.Type,
    in runtime: JavaScriptRuntime,
    prototypes: SharedObjectPrototypes
  ) throws -> JavaScriptObject {
    let typeId = ObjectIdentifier(type)

    if let prototype = prototypes.classPrototypes[typeId]?.withUnwrappedValue({ (prototype: borrowing JavaScriptObject) in
      prototype.asValue().getObject()
    }) {
      return prototype
    }
    let superclassPrototype: JavaScriptObject
    if let superclassType = type.resolvedJSSuperclassType {
      superclassPrototype = try classPrototype(for: superclassType, in: runtime, prototypes: prototypes)
    } else {
      superclassPrototype = try basePrototype(for: type, in: runtime)
    }
    let prototype: JavaScriptObject
    if let classDefinition = findClassDefinition(for: typeId) {
      prototype = try classDefinition.buildPrototype(in: runtime, appContext: self, basePrototype: superclassPrototype)
    } else {
      prototype = try JavaScriptBindings.buildSharedObjectPrototype(type, in: runtime, basePrototype: superclassPrototype)
    }
    prototypes.classPrototypes[typeId] = prototype.asValue().getObject().ref()
    return prototype
  }

  /// Returns the prototype of the base `SharedRef` class for a `SharedRef` type, otherwise of the base `SharedObject`
  /// class, in the given runtime.
  @JavaScriptActor
  private func basePrototype(for type: any AnyJavaScriptClass.Type, in runtime: JavaScriptRuntime) throws -> JavaScriptObject {
    return try runtime.global()
      .getPropertyAsObject(globalCoreObjectPropertyName)
      .getPropertyAsObject(type is AnySharedRef.Type ? "SharedRef" : "SharedObject")
      .getPropertyAsObject("prototype")
  }

  /**
   Finds the ClassDefinition for a given native type identifier by searching all modules.
   */
  private func findClassDefinition(for typeId: ObjectIdentifier) -> ClassDefinition? {
    for module in allModuleHolders {
      for (_, classDefinition) in module.definition.classes {
        if let sharedObjectType = classDefinition.associatedType as? DynamicSharedObjectType,
           sharedObjectType.typeIdentifier == typeId {
          return classDefinition
        }
      }
    }
    return nil
  }

  /// Finds the class for a given native type identifier among the classes that modules register in `_classTypes`
  /// and the classes that packages export.
  private func findClassType(for typeId: ObjectIdentifier) -> (any AnyJavaScriptClass.Type)? {
    for module in allModuleHolders {
      if let classType = type(of: module.module)._classTypes.first(where: { ObjectIdentifier($0) == typeId }) {
        return classType
      }
    }
    return packageRegistry.sharedObjectType(for: typeId)
  }

  /**
   Unsets runtime objects that we hold for each module.
   */
  @JavaScriptActor
  private func releaseRuntimeObjects() {
    sharedObjectRegistry.clear()
    classRegistry.clear()

    for module in allModuleHolders {
      module.releaseJavaScriptObject()
    }
  }

  // MARK: - Recovery

  /// Returns the app context that prepared the given runtime, or `nil` if no app context did
  /// (its `global.expo` object carries no `NativeState`). Lets code that only has a runtime
  /// recover the app context without capturing a reference to it, e.g. a `JavaScriptCodable`
  /// witness that has the runtime but not the context.
  @JavaScriptActor
  public static func from(runtime: borrowing JavaScriptRuntime) -> AppContext? {
    // Recovery may happen on every conversion, so look the core object up through a cached
    // prop name id to avoid re-interning the "expo" string into JSI on each call.
    let coreObjectPropName = JavaScriptPropNameID.cached(runtime, globalCoreObjectPropertyName)
    guard let coreObject = try? runtime.global().getPropertyAsObject(coreObjectPropName) else {
      return nil
    }
    return coreObject.getNativeState(as: NativeState.self)?.appContext
  }

  /// Native state attached to the `global.expo` object that holds a strong reference to the
  /// app context. It serves two purposes:
  ///
  /// - Lifetime: because the native state lives on the runtime's heap and is torn down only
  ///   when the runtime finalizes, holding the app context strongly ties its lifetime to the
  ///   runtime. This defers the app context's release (and its `destroy()` cleanup of cached
  ///   JSI objects) to runtime finalization, avoiding a teardown-ordering crash during reloads
  ///   where the context could otherwise deallocate while the runtime is still tearing down on
  ///   another thread.
  /// - Recovery: any code holding the runtime can recover the app context via
  ///   `AppContext.from(runtime:)` (which reads this native state off `global.expo`) instead of
  ///   capturing a reference to it.
  ///
  /// A single app context can prepare several runtimes (e.g. the main and the UI runtime),
  /// each getting its own native state. Only the one whose runtime owns the app context's
  /// lifecycle (the main runtime) runs `destroy()` when it dies, so a subordinate runtime
  /// tearing down doesn't destroy an app context still backing the others.
  ///
  /// This forms a strong reference cycle that routes through the runtime heap
  /// (`AppContext` -> runtime -> `global.expo` -> `NativeState` -> `AppContext`). That is
  /// intentional: the cycle is broken only when the runtime is torn down (which frees the
  /// native state and fires its deallocator), which is exactly what defers the app context's
  /// release until the runtime is gone. The app context never holds the native state directly.
  ///
  /// An app context that owns its runtime (see ``ownsRuntime``) isn't pinned, as the cycle would
  /// never break. The native state references it weakly and the app context tears the runtime
  /// down in its own `deinit`.
  internal final class NativeState: JavaScriptNativeState {
    internal weak let appContext: AppContext?

    /// The strong reference that pins the app context, or `nil` when it isn't pinned.
    private let pinnedAppContext: AppContext?

    /// Whether releasing this native state should tear the app context down. Set only for the
    /// main runtime; subordinate runtimes pin the app context and enable recovery without
    /// destroying it.
    internal let ownsLifecycle: Bool

    internal init(appContext: AppContext, ownsLifecycle: Bool) {
      self.appContext = appContext
      self.pinnedAppContext = appContext.ownsRuntime ? nil : appContext
      self.ownsLifecycle = ownsLifecycle
      super.init()
      setDeallocator { nativeState in
        guard let nativeState = nativeState as? NativeState, nativeState.ownsLifecycle else {
          return
        }
        // Hermes runs this on its finalizer thread while the JS thread waits in the runtime's
        // destructor, so nothing else uses the runtime and `destroy()` can release JS objects
        // here. Don't send that work to another thread: it would run after Hermes frees its
        // values. A future cross-runtime sharing path that could drop this state's last JSI slot
        // while the runtime still runs JavaScript (see `JavaScriptNativeState.acquireShared`)
        // would need to hop to the JS thread here first.
        nativeState.appContext?.destroy()
      }
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

    // Nothing pins an app context that owns its runtime, so the runtime outlives it only until its
    // stored properties are released. Release the JavaScript objects before that.
    if ownsRuntime && _runtime != nil {
      destroy()
    }

    // Post an event only to the registries that were already created.
    // If we let them lazy-load here, that would crash since the registries
    // have a weak reference to the app context which is being deallocated.
    postToModules(event: .appContextDestroys)
  }

  @objc
  public func setHostWrapper(_ wrapper: ExpoHostWrapper) {
    self.hostWrapper = wrapper

    // This is called on the JS thread, possibly before `RCTHost` stores the instance that owns this runtime,
    // so its surface presenter can't be read yet. The host stores the instance on the main thread
    // in the same call that starts the runtime, so the presenter is available on the next main queue turn.
    DispatchQueue.main.async { [weak self] in
      guard let self, let hostWrapper = self.hostWrapper else {
        return
      }
      self.observeMounting(with: hostWrapper)
    }
  }

  // MARK: - Statics

  /**
   Returns an instance of the generated Expo modules provider.
   The provider is usually generated in application's `ExpoModulesProviders` files group.
   */
  @objc
  public static func modulesProvider(withName providerName: String = "ExpoModulesProvider") -> ModulesProvider {
    // [0] When ExpoModulesCore is built as a separate framework/module,
    // explicitly load the main bundle's `ExpoModulesProvider` class.
    // `ExpoModulesProviderModuleName` is an internal key that allows repack-app to
    // preserve the original Swift module name. Try `CFBundleExecutable` next because
    // it usually matches the Swift module name. Keep `CFBundleName` as a final fallback
    // for cases where it is also a valid module identifier.
    let mainBundleNames = [
      Bundle.main.infoDictionary?["ExpoModulesProviderModuleName"],
      Bundle.main.infoDictionary?["CFBundleExecutable"],
      Bundle.main.infoDictionary?["CFBundleName"]
    ].compactMap { $0 as? String }

    for providerClassName in moduleProviderClassNames(withName: providerName, bundleNames: mainBundleNames) {
      if let providerClass = NSClassFromString(providerClassName) as? ModulesProvider.Type {
        return providerClass.init()
      }
    }

    // [1] Fallback to `ExpoModulesProvider` class from the current module.
    if let providerClass = NSClassFromString(providerName) as? ModulesProvider.Type {
      return providerClass.init()
    }

    // [2] Fallback to the framework that contains ExpoModulesCore itself (brownfield use case).
    // Brownfield apps often prelink React Native and Expo into one dynamic framework; the
    // generated provider is then compiled into that framework, so its Swift module is the
    // framework's name and the main-bundle lookups above miss. Trying this bundle first avoids
    // the `Bundle.allFrameworks` scan below, which materializes a bundle for every loaded
    // framework and runs inside `+load` on every cold launch.
    let coreBundle = Bundle(for: AppContext.self)
    if coreBundle.bundlePath != Bundle.main.bundlePath {
      let coreBundleNames = [
        coreBundle.infoDictionary?["CFBundleExecutable"],
        coreBundle.infoDictionary?["CFBundleName"]
      ].compactMap { $0 as? String }

      for providerClassName in moduleProviderClassNames(withName: providerName, bundleNames: coreBundleNames) {
        if let providerClass = NSClassFromString(providerClassName) as? ModulesProvider.Type {
          return providerClass.init()
        }
      }
    }

    // [3] Fallback to search for `ExpoModulesProvider` in frameworks (brownfield use case)
    for bundle in Bundle.allFrameworks {
      let frameworkBundleNames = [
        bundle.infoDictionary?["CFBundleExecutable"],
        bundle.infoDictionary?["CFBundleName"]
      ].compactMap { $0 as? String }

      for providerClassName in moduleProviderClassNames(withName: providerName, bundleNames: frameworkBundleNames) {
        if let providerClass = NSClassFromString(providerClassName) as? ModulesProvider.Type {
          return providerClass.init()
        }
      }
    }

    // [4] Fallback to an empty `ModulesProvider` if `ExpoModulesProvider` was not generated
    return ModulesProvider()
  }

  internal static func moduleProviderClassNames(withName providerName: String, bundleNames: [String]) -> [String] {
    var seen = Set<String>()
    return bundleNames.flatMap { [$0, c99ExtendedIdentifier($0)] }.compactMap { bundleName in
      let candidate = "\(bundleName).\(providerName)"
      return seen.insert(candidate).inserted ? candidate : nil
    }
  }

  /**
   Applies the same substitution as Xcode's `:c99extidentifier` string operator, which derives the
   default `PRODUCT_MODULE_NAME` (and thus the Swift module name) from `PRODUCT_NAME`. The bundle
   names above are the raw product name, so the two differ whenever the product name is not a valid
   C99 identifier — most commonly when the app's `name` starts with a digit, where a product name of
   `123myapp` compiles into the Swift module `_23myapp`.
   */
  internal static func c99ExtendedIdentifier(_ name: String) -> String {
    var characters = name.map { $0.isLetter || $0.isNumber || $0 == "_" ? $0 : "_" }
    if let first = characters.first, first.isNumber {
      characters[0] = "_"
    }
    return String(characters)
  }

  public func reloadAppAsync(_ reason: String = "Reload from appContext") {
    if moduleRegistry.has(moduleWithName: "ExpoGo") {
      NotificationCenter.default.post(name: NSNotification.Name(rawValue: "EXReloadActiveAppRequest"), object: nil)
    } else {
      // Must run on the main thread (see #31789), but synchronously when already there — deferring
      // via `DispatchQueue.main.async` deadlocks the bridgeless reload against TurboModule teardown.
      let trigger = { RCTTriggerReloadCommandListeners(reason) }
      if Thread.isMainThread {
        trigger()
      } else {
        DispatchQueue.main.async(execute: trigger)
      }
    }
  }
}

/**
 Reference-type store for cached worklet prototypes. Needed because JavaScriptObject
 is ~Copyable and cannot be stored in a Dictionary; we cache the prototype as a
 `JavaScriptValue.Ref` and rehydrate a JavaScriptObject on use.
 */
@JavaScriptActor
/// The prototypes of shared object classes in a runtime other than the main runtime, by native class. Prototypes
/// are kept behind `JavaScriptRef` because `JavaScriptObject` is ~Copyable and cannot be a Dictionary value.
private final class SharedObjectPrototypes {
  /// The prototype for an instance of each native class, which can be the prototype of a superclass.
  var instancePrototypes: [ObjectIdentifier: JavaScriptObject.Ref] = [:]
  /// The prototype of the JS class of each native class.
  var classPrototypes: [ObjectIdentifier: JavaScriptObject.Ref] = [:]
}

private let sharedObjectPrototypesCacheKey = JavaScriptRuntime.Cache.Key<SharedObjectPrototypes>()

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

internal final class RuntimeAttachedToAnotherAppContextException: Exception, @unchecked Sendable {
  override var reason: String {
    "The runtime already has `global.expo` of another app context"
  }
}

// Deprecated since v1.0.0
@available(*, deprecated, renamed: "Exceptions.AppContextLost")
public typealias AppContextLostException = Exceptions.AppContextLost

// Deprecated since v1.0.0
@available(*, deprecated, renamed: "Exceptions.RuntimeLost")
public typealias RuntimeLostException = Exceptions.RuntimeLost
