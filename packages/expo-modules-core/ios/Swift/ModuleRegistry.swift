public final class ModuleRegistry: Sequence {
  public typealias Element = ModuleHolder

  private weak var appContext: AppContext?

  private var registry: [String: ModuleHolder] = [:]

  init(appContext: AppContext) {
    self.appContext = appContext
  }

  /**
   Registers an instance of module holder.
   */
  internal func register(holder: ModuleHolder) {
    log.info("Registering module '\(holder.name)'")
    registry[holder.name] = holder
  }

  /**
   Registers a module by its type.
   */
  public func register(moduleType: AnyModule.Type) {
    guard let appContext = appContext else {
      return
    }
    let module = moduleType.init(appContext: appContext)
    let holder = ModuleHolder(appContext: appContext, module: module)
    register(holder: holder)
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
