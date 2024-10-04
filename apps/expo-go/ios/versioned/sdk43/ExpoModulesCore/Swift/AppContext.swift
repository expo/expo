import UIKit
/**
 The app context is an interface to a single Expo app.
 */
public class AppContext {
  /**
   The module registry for the app context.
   */
  public private(set) lazy var moduleRegistry: ModuleRegistry = ModuleRegistry(appContext: self)

  /**
   The legacy module registry with modules written in the old-fashioned way.
   */
  public private(set) var legacyModuleRegistry: ABI43_0_0EXModuleRegistry?

  /**
   Designated initializer without modules provider.
   */
  public init() {
    listenToClientAppNotifications()
  }

  /**
   Initializes the app context and registers provided modules in the module registry.
   */
  public convenience init(withModulesProvider provider: ModulesProviderProtocol, legacyModuleRegistry: ABI43_0_0EXModuleRegistry?) {
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
  public var constants: ABI43_0_0EXConstantsInterface? {
    return legacyModule(implementing: ABI43_0_0EXConstantsInterface.self)
  }

  /**
   Provides access to the file system manager from legacy module registry.
   */
  public var fileSystem: ABI43_0_0EXFileSystemInterface? {
    return legacyModule(implementing: ABI43_0_0EXFileSystemInterface.self)
  }

  /**
   Provides access to the permissions manager from legacy module registry.
   */
  public var permissions: ABI43_0_0EXPermissionsInterface? {
    return legacyModule(implementing: ABI43_0_0EXPermissionsInterface.self)
  }

  /**
   Provides access to the image loader from legacy module registry.
   */
  public var imageLoader: ABI43_0_0EXImageLoaderInterface? {
    return legacyModule(implementing: ABI43_0_0EXImageLoaderInterface.self)
  }

  /**
   Provides access to the utilities from legacy module registry.
   */
  public var utilities: ABI43_0_0EXUtilitiesInterface? {
    return legacyModule(implementing: ABI43_0_0EXUtilitiesInterface.self)
  }

  /**
   Starts listening to `UIApplication` notifications.
   */
  private func listenToClientAppNotifications() {
    [
      UIApplication.willEnterForegroundNotification,
      UIApplication.didBecomeActiveNotification,
      UIApplication.didEnterBackgroundNotification,
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

  /**
   Cleans things up before deallocation.
   */
  deinit {
    NotificationCenter.default.removeObserver(self)
    moduleRegistry.post(event: .appContextDestroys)
  }
}
