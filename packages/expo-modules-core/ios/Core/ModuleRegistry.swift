public final class ModuleRegistry: Sequence {
  public typealias Element = ModuleHolder

  private weak var appContext: AppContext?

  private let registry = Mutex<[String: ModuleHolder]>([:])
  private var overrideDisallowModules = Set<String>()

  init(appContext: AppContext) {
    self.appContext = appContext
  }

  /**
   Registers an instance of module holder.
   */
  internal func register(holder: ModuleHolder, preventModuleOverriding: Bool = false) {
    log.info("Registering module '\(holder.name)'")

    if preventModuleOverriding {
      overrideDisallowModules.insert(holder.name)
    }
    let didRegister = registry.withLock { registry -> Bool in
      // if overriding is disallowed for this module and the module already registered, don't re-register
      if overrideDisallowModules.contains(holder.name) && registry[holder.name] != nil {
        log.info(
          "Not re-registering module '\(holder.name)' since a previous registration specified preventModuleOverriding: true"
        )
        return false
      }
      registry[holder.name] = holder
      return true
    }
    if didRegister {
      // Call the `didCreate` lifecycle hook only after the holder is in the registry, so lookups such as
      // `get(moduleWithName:)` can already find the module. Rejected registrations don't get it.
      holder.module.didCreate()
    }
  }

  /**
   Registers an instance of the module.
   */
  public func register(module: AnyModule, name: String?, preventModuleOverriding: Bool = false) {
    register(module: module, name: name, packageName: nil, preventModuleOverriding: preventModuleOverriding)
  }

  /**
   Registers an instance of the module in the package with the given name.
   */
  func register(
    module: AnyModule,
    name: String?,
    packageName: String?,
    preventModuleOverriding: Bool = false
  ) {
    guard let appContext else {
      log.error("Unable to register a module '\(module)', the app context is unavailable")
      return
    }
    register(
      holder: ModuleHolder(appContext: appContext, module: module, name: name, packageName: packageName),
      preventModuleOverriding: preventModuleOverriding)
  }

  /**
   Registers a module by its type.
   */
  public func register(moduleType: AnyModule.Type, name: String?, preventModuleOverriding: Bool = false) {
    register(moduleType: moduleType, name: name, packageName: nil, preventModuleOverriding: preventModuleOverriding)
  }

  /**
   Registers a module by its type in the package with the given name.
   */
  func register(
    moduleType: AnyModule.Type,
    name: String?,
    packageName: String?,
    preventModuleOverriding: Bool = false
  ) {
    guard let appContext else {
      log.error("Unable to register a module '\(moduleType)', the app context is unavailable")
      return
    }
    register(
      module: moduleType.init(appContext: appContext),
      name: name,
      packageName: packageName,
      preventModuleOverriding: preventModuleOverriding)
  }

  /**
   Registers modules exported by given modules provider.
   */
  public func register(fromProvider provider: ModulesProviderProtocol) {
    provider.getModuleClasses().forEach { module, name in
      register(moduleType: module, name: name)
    }
    // The packages are registered after the other modules, so a module declared with the macros wins
    // over another module with the same name, even over a local module that is not declared with the macros.
    for (packageName, package) in ExpoPackage.inRegistrationOrder(provider.packages) {
      register(package: package, named: packageName)
    }
  }

  /**
   Registers the modules of the package with the given name.
   */
  func register(package: ExpoPackage, named packageName: String) {
    for module in package.modules {
      register(moduleType: module, name: nil, packageName: packageName)
    }
  }

  /**
   Unregisters given module from the registry.
   */
  public func unregister(module: AnyModule) {
    registry.withLock { registry in
      if let index = registry.firstIndex(where: { $1.module === module }) {
        registry.remove(at: index)
      }
    }
  }

  public func unregister(moduleName: String) {
    registry.withLock { registry in
      if registry[moduleName] != nil {
        log.info("Unregistering module '\(moduleName)'")
        registry[moduleName] = nil
      }
    }
  }

  public func has(moduleWithName moduleName: String) -> Bool {
    return registry.withLock { registry in
      return registry[moduleName] != nil
    }
  }

  public func get(moduleHolderForName moduleName: String) -> ModuleHolder? {
    return registry.withLock { registry in
      return registry[moduleName]
    }
  }

  public func get(moduleWithName moduleName: String) -> AnyModule? {
    return registry.withLock { registry in
      registry[moduleName]?.module
    }
  }

  public func getModule<ModuleProtocol>(implementing protocol: ModuleProtocol.Type) -> ModuleProtocol? {
    return registry.withLock { registry in
      for holder in registry.values {
        if let module = holder.module as? ModuleProtocol {
          return module
        }
      }
      return nil
    }
  }

  public func getModuleNames() -> [String] {
    return registry.withLock { registry in
      return Array(registry.keys)
    }
  }

  /**
   The names of the packages of the registered modules, without duplicates. The local package comes first,
   and the others are sorted. A package is not listed when modules of other packages override all its modules.
   */
  var packageNames: [String] {
    let names = registry.withLock { registry in
      return Set(registry.values.compactMap(\.packageName))
    }
    return names.sorted { lhs, rhs in
      if (lhs == ExpoPackage.localPackageName) != (rhs == ExpoPackage.localPackageName) {
        return lhs == ExpoPackage.localPackageName
      }
      return lhs < rhs
    }
  }

  /**
   Returns whether any registered module or shared object class is in the package with the given name.
   */
  func hasPackage(named packageName: String) -> Bool {
    return registry.withLock { registry in
      return registry.values.contains { $0.packageName == packageName }
    }
  }

  /**
   Returns the holders of the modules in the package with the given name, sorted by the module name.
   */
  func moduleHolders(inPackage packageName: String) -> [ModuleHolder] {
    let holders = registry.withLock { registry in
      return registry.values.filter { $0.packageName == packageName }
    }
    return holders.sorted { $0.name < $1.name }
  }

  public func makeIterator() -> IndexingIterator<[ModuleHolder]> {
    return registry.withLock { registry in
      return registry.map({ $1 }).makeIterator()
    }
  }

  internal func post(event: EventName) {
    log.info("Posting '\(event)' event to registered modules")
    forEach { holder in
      holder.post(event: event)
    }
  }

  internal func post<PayloadType>(event: EventName, payload: PayloadType? = nil) {
    log.info("Posting '\(event)' event to registered modules")
    forEach { holder in
      holder.post(event: event, payload: payload)
    }
  }

}
