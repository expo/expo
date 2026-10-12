// A stand-in for `expo-modules-core`, which doesn't build on Windows yet. It declares only what the
// `@ExpoModule` and `@JS` macro expansions refer to for functions with primitive arguments, with
// the same names and signatures as in `packages/expo-modules-core/ios`, so module code compiles as
// it would against the real package.

@_exported import ExpoModulesJSI

// MARK: - Macros (from `Core/ExpoModulesMacros.swift`)

public enum JSOptions {
  case concurrent
}

@attached(peer, names: arbitrary)
public macro JS(_ jsName: String? = nil, _ options: JSOptions...) =
  #externalMacro(module: "ExpoModulesMacros", type: "JSMacro")

@attached(peer, names: arbitrary)
public macro JS(_ options: JSOptions...) =
  #externalMacro(module: "ExpoModulesMacros", type: "JSMacro")

@attached(
  member,
  names:
    named(_jsName), named(_synthesizedDefinition), named(appContext), named(init),
    named(_decorateModule))
@attached(memberAttribute)
@attached(extension, conformances: AnyModule)
public macro ExpoModule(_ name: String? = nil, classes: [Any.Type] = []) =
  #externalMacro(module: "ExpoModulesMacros", type: "ExpoModuleMacro")

// MARK: - Modules (from `Core/Protocols/AnyModule.swift` and `Core/Modules/Module.swift`)

/// The real one owns the runtime, the module registry and the event emitter.
public final class AppContext {
  public let runtime: JavaScriptRuntime

  public init(runtime: JavaScriptRuntime) {
    self.runtime = runtime
  }
}

public protocol AnyDefinition: ~Copyable {}

public protocol AnyModule: AnyObject {
  init(appContext: AppContext)

  static var _jsName: String { get }

  func _synthesizedDefinition() -> [AnyDefinition]

  @JavaScriptActor
  func _decorateModule(object: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws
}

extension AnyModule {
  public static var _jsName: String {
    return String(describing: self)
  }

  public func _synthesizedDefinition() -> [AnyDefinition] {
    return []
  }

  @JavaScriptActor
  public func _decorateModule(object: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {
  }
}

open class BaseModule {
  public private(set) weak var appContext: AppContext?

  required public init(appContext: AppContext) {
    self.appContext = appContext
  }
}

public typealias Module = AnyModule & BaseModule

// MARK: - Exceptions (from `Core/Exceptions/CommonExceptions.swift`)

public enum Exceptions {
  public struct ArgumentsRangeMismatch: Error, CustomStringConvertible {
    let param: (functionName: String, received: Int, required: Int, maximum: Int)

    public init(_ param: (functionName: String, received: Int, required: Int, maximum: Int)) {
      self.param = param
    }

    public var description: String {
      if param.required == param.maximum {
        return "'\(param.functionName)' takes \(param.maximum) argument(s), but received \(param.received)"
      }
      return "'\(param.functionName)' takes from \(param.required) to \(param.maximum) arguments, but received \(param.received)"
    }
  }
}
