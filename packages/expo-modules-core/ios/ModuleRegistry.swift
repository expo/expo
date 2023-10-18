public final class ModuleRegistry: Sequence {
  public typealias Element = ModuleHolder

  private weak var appContext: AppContext?

  private var registry: [String: ModuleHolder] = [:]
  private var overrideDisallowModules = Set<String>()

  init(appContext: AppContext) {
    self.appContext = appContext
  }

  /**
   Registers an instance of module holder.
   */
  internal func register(holder: ModuleHolder, preventModuleOverriding: Bool = false) {
    log.info("Registering module '\(holder.name)'")

    // if overriding is disallowed for this module and the module already registered, don't re-register
    if overrideDisallowModules.contains(holder.name) && registry[holder.name] != nil {
      log.info("Not re-registering module '\(holder.name)' since a previous registration specified preventModuleOverriding: true")
      return
    }

    if preventModuleOverriding {
      overrideDisallowModules.insert(holder.name)
    }
    registry[holder.name] = holder
  }

  /**
   Registers an instance of the module.
   */
  public func register(module: AnyModule, preventModuleOverriding: Bool = false) {
    guard let appContext else {
      log.error("Unable to register a module '\(module)', the app context is unavailable")
      return
    }
    register(holder: ModuleHolder(appContext: appContext, module: module), preventModuleOverriding: preventModuleOverriding)
  }

  /**
   Registers a module by its type.
   */
  public func register(moduleType: AnyModule.Type, preventModuleOverriding: Bool = false) {
    guard let appContext else {
      log.error("Unable to register a module '\(moduleType)', the app context is unavailable")
      return
    }
    register(module: moduleType.init(appContext: appContext), preventModuleOverriding: preventModuleOverriding)
  }

  /**
   Registers modules exported by given modules provider.
   */
  public func register(fromProvider provider: ModulesProviderProtocol) {
    provider.getModuleClasses().forEach { moduleType in
      register(moduleType: moduleType)
    }
  }

  /**
   Unregisters given module from the registry.
   */
  public func unregister(module: AnyModule) {
    if let index = registry.firstIndex(where: { $1.module === module }) {
      registry.remove(at: index)
    }
  }

  public func unregister(moduleName: String) {
    if registry[moduleName] != nil {
      log.info("Unregistering module '\(moduleName)'")
      registry[moduleName] = nil
    }
  }

  public func has(moduleWithName moduleName: String) -> Bool {
    return registry[moduleName] != nil
  }

  public func get(moduleHolderForName moduleName: String) -> ModuleHolder? {
    return registry[moduleName]
  }

  public func get(moduleWithName moduleName: String) -> AnyModule? {
    return registry[moduleName]?.module
  }

  public func getModuleNames() -> [String] {
    return Array(registry.keys)
  }

  public func makeIterator() -> IndexingIterator<[ModuleHolder]> {
    return registry.map({ $1 }).makeIterator()
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
