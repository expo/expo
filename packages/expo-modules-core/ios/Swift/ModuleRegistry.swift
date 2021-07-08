
public class ModuleRegistry: Sequence {
  public typealias Element = ModuleHolder

  private weak var appContext: AppContext?

  private var registry: [String: ModuleHolder] = [:]

  init(appContext: AppContext) {
    self.appContext = appContext
  }

  /**
   Registers a single module in the registry.
   */
  public func register(module: AnyModule) {
    let holder = ModuleHolder(module: module)
    registry[holder.name] = holder
  }

  /**
   Registers modules exported by given modules provider.
   */
  public func register(fromProvider provider: ModulesProviderProtocol) {
    guard let appContext = appContext else {
      // TODO: (@tsapeta) App context is deallocated, throw an error?
      return
    }
    provider.exportedModules().forEach { moduleType in
      register(module: moduleType.init(appContext: appContext))
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

  public func makeIterator() -> IndexingIterator<[ModuleHolder]> {
    return registry.map({ $1 }).makeIterator()
  }
}
