
public class ModuleRegistry: Sequence {
  public typealias Element = ModuleHolder

  private weak var appContext: AppContext?

  private var registry: [String: ModuleHolder] = [:]

  init(appContext: AppContext) {
    self.appContext = appContext
  }

  /**
   Registers a module by its definition.
   */
  public func register(definition: ModuleDefinition) {
    guard let appContext = appContext else {
      return
    }
    registry[definition.name] = ModuleHolder(appContext: appContext, definition: definition)
  }

  /**
   Registers a module by its type.
   */
  public func register(moduleType: AnyModule.Type) {
    register(definition: moduleType.definition().withType(moduleType))
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
    registry.removeValue(forKey: moduleName)
  }

  public func has(moduleWithName moduleName: String) -> Bool {
    return registry[moduleName] != nil
  }

  public func get(moduleHolderForName moduleName: String) -> ModuleHolder? {
    return registry[moduleName]
  }

  @discardableResult
  public func get(moduleWithName moduleName: String) -> AnyModule? {
    return try? registry[moduleName]?.getInstance()
  }

  public func makeIterator() -> IndexingIterator<[ModuleHolder]> {
    return registry.map({ $1 }).makeIterator()
  }

  internal func post(event: EventName) {
    forEach { holder in
      holder.post(event: event)
    }
  }

  internal func post<PayloadType>(event: EventName, payload: PayloadType? = nil) {
    forEach { holder in
      holder.post(event: event, payload: payload)
    }
  }
}
