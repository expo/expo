import UIKit
/**
 The app context is an interface to a single Expo app.
 */
public final class AppContext {
  internal static func create() -> AppContext {
    let appContext = AppContext()

    appContext.runtime = JavaScriptRuntime()
    return appContext
  }

  /**
   The module registry for the app context.
   */
  public private(set) lazy var moduleRegistry: ModuleRegistry = ModuleRegistry(appContext: self)

  /**
   The legacy module registry with modules written in the old-fashioned way.
   */
  public private(set) weak var legacyModuleRegistry: EXModuleRegistry?

  /**
   React bridge of the context's app.
   */
  public internal(set) weak var reactBridge: RCTBridge?

  /**
   JSI runtime of the running app.
   */
  public internal(set) var runtime: JavaScriptRuntime? {
    didSet {
      // When the runtime is unpinned from the context (e.g. deallocated),
      // we should make sure to release all JS objects from the memory.
      // Otherwise the JSCRuntime asserts may fail on deallocation.
      if runtime == nil {
        releaseRuntimeObjects()
      }
    }
  }

  /**
   Designated initializer without modules provider.
   */
  public init() {
    listenToClientAppNotifications()
  }

  /**
   Initializes the app context and registers provided modules in the module registry.
   */
  public convenience init(withModulesProvider provider: ModulesProviderProtocol, legacyModuleRegistry: EXModuleRegistry?) {
    self.init()
    self.legacyModuleRegistry = legacyModuleRegistry
    moduleRegistry.register(fromProvider: provider)
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

  // MARK: - Runtime

  internal func installExpoModulesHostObject(_ interopBridge: SwiftInteropBridge) throws {
    guard let runtime = runtime else {
      throw UndefinedRuntimeException()
    }
    EXJavaScriptRuntimeManager.installExpoModules(to: runtime, withSwiftInterop: interopBridge)
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
    moduleRegistry.post(event: .appContextDestroys)
  }

  // MARK: - Exceptions

  class DeallocatedAppContextException: Exception {
    override var reason: String {
      "The AppContext has been deallocated"
    }
  }

  class UndefinedRuntimeException: Exception {
    override var reason: String {
      "The AppContext has undefined runtime"
    }
  }
}
