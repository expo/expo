// The core module that describes the `global.expo` object.
internal final class CoreModule: Module {
  internal func definition() -> ModuleDefinition {
    // Expose some common classes and maybe even the `modules` host object in the future.
    Function("uuidv4") { () -> String in
      return UUID().uuidString.lowercased()
    }

    Function("uuidv5") { (name: String, namespace: String) -> String in
      guard let namespaceUuid = UUID(uuidString: namespace) else {
        throw InvalidNamespaceException(namespace)
      }

      return uuidv5(name: name, namespace: namespaceUuid).uuidString.lowercased()
    }
  }
}
