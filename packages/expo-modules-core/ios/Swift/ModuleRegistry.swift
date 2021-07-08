
public class ModuleRegistry: Sequence {
  private var registry: [String: ModuleHolder] = [:]

  init(withProvider provider: ModulesProviderProtocol) {
    provider.exportedModules().forEach { moduleType in
      register(module: moduleType.init())
    }
  }

  public func register(module: AnyModule) {
    let holder = ModuleHolder(module: module)
    registry[holder.name] = holder
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
