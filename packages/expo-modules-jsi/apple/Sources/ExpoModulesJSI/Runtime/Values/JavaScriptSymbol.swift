// Copyright 2026-present 650 Industries. All rights reserved.

internal import jsi

/// A Swift representation of a JavaScript symbol. A symbol is a unique primitive value, mostly used as a
/// property key that can't collide with string keys.
///
/// JSI has no API to create symbols, so the initializers call the global `Symbol` function.
///
/// ## Example Usage
/// ```swift
/// let runtime = JavaScriptRuntime()
///
/// // Create a unique symbol
/// let symbol = try JavaScriptSymbol(runtime, description: "id")
/// symbol.toString()  // "Symbol(id)"
///
/// // Get a symbol from the global registry
/// let registered = try JavaScriptSymbol.for(runtime, "app.id")
///
/// // Use a well-known symbol as a property key
/// let toStringTag = try JavaScriptSymbol.wellKnown(runtime, .toStringTag)
/// object.setProperty(JavaScriptPropNameID(runtime, symbol: toStringTag), value: JavaScriptValue(runtime, "Cache"))
/// ```
public struct JavaScriptSymbol: JavaScriptType, Sendable, ~Copyable {
  /// Handle to the runtime the symbol belongs to.
  internal let runtimeHandle: JavaScriptRuntimeHandle

  /// The engine runtime the symbol belongs to, or `nil` if the runtime has been deallocated.
  internal var jsiRuntime: facebook.jsi.IRuntime? {
    return runtimeHandle.pointee
  }
  internal var pointee: facebook.jsi.Symbol

  /// Creates a symbol from an existing JSI symbol.
  internal init(_ runtime: borrowing JavaScriptRuntime, _ symbol: consuming facebook.jsi.Symbol) {
    self.runtimeHandle = runtime.handle
    self.pointee = symbol
  }

  /// Creates a symbol from an existing JSI symbol, which belongs to the runtime behind `runtimeHandle`.
  internal init(_ runtimeHandle: JavaScriptRuntimeHandle, _ symbol: consuming facebook.jsi.Symbol) {
    self.runtimeHandle = runtimeHandle
    self.pointee = symbol
  }

  /// Creates a new unique symbol, like `Symbol(description)` in JavaScript.
  ///
  /// - Parameters:
  ///   - runtime: The JavaScript runtime
  ///   - description: The description of the symbol, used only for debugging. `nil` creates a symbol with
  ///     an undefined description.
  @JavaScriptActor
  public init(_ runtime: borrowing JavaScriptRuntime, description: String? = nil) throws {
    let cache = try Self.cache(in: runtime)
    let symbol: JavaScriptValue
    if let description {
      symbol = try cache.constructor.call(argument: JavaScriptValue(runtime, description))
    } else {
      symbol = try cache.constructor.call()
    }
    self = try symbol.asSymbol()
  }

  /// Returns the symbol registered under `key` in the global symbol registry, like `Symbol.for(key)` in
  /// JavaScript. The registry creates the symbol on the first call with a key.
  @JavaScriptActor
  public static func `for`(_ runtime: borrowing JavaScriptRuntime, _ key: String) throws -> JavaScriptSymbol {
    let cache = try Self.cache(in: runtime)
    return try cache.registryFor.call(argument: JavaScriptValue(runtime, key)).asSymbol()
  }

  /// Returns the given well-known symbol, such as `Symbol.iterator`. Each well-known symbol is read from
  /// the global `Symbol` function on first use and then cached in the runtime.
  @JavaScriptActor
  public static func wellKnown(_ runtime: borrowing JavaScriptRuntime, _ symbol: WellKnown) throws -> JavaScriptSymbol {
    return try cache(in: runtime).wellKnown(symbol)
  }

  /// Converts the symbol to a string, like `toString()` in JavaScript. The result has the form
  /// `Symbol(description)`.
  public func toString() -> String {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return String(pointee.toString(jsiRuntime))
  }

  // MARK: - JavaScriptType

  public func asValue() -> JavaScriptValue {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return JavaScriptValue(runtimeHandle, facebook.jsi.Value(jsiRuntime, pointee))
  }

  /// Returns the symbol as a `facebook.jsi.Value` instance.
  internal func asJSIValue() -> facebook.jsi.Value {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return facebook.jsi.Value(jsiRuntime, pointee)
  }

  // MARK: - Equality

  /// Tests whether two symbols are the same symbol, as defined by JavaScript's `===` operator.
  public static func == (lhs: borrowing JavaScriptSymbol, rhs: borrowing JavaScriptSymbol) -> Bool {
    guard let jsiRuntime = lhs.jsiRuntime else {
      FatalError.runtimeLost()
    }
    return facebook.jsi.Symbol.strictEquals(jsiRuntime, lhs.pointee, rhs.pointee)
  }

  // MARK: - Well-known symbols

  /// The well-known symbols, which are properties of the global `Symbol` function. An engine may not define
  /// all of them, and ``wellKnown(_:_:)`` throws for a symbol that the engine doesn't define.
  public enum WellKnown: Int, CaseIterable, Sendable {
    case asyncDispose
    case asyncIterator
    case dispose
    case hasInstance
    case isConcatSpreadable
    case iterator
    case match
    case matchAll
    case replace
    case search
    case species
    case split
    case toPrimitive
    case toStringTag
    case unscopables

    /// The name of the property of the global `Symbol` function that holds the symbol.
    internal var propertyName: String {
      switch self {
      case .asyncDispose: return "asyncDispose"
      case .asyncIterator: return "asyncIterator"
      case .dispose: return "dispose"
      case .hasInstance: return "hasInstance"
      case .isConcatSpreadable: return "isConcatSpreadable"
      case .iterator: return "iterator"
      case .match: return "match"
      case .matchAll: return "matchAll"
      case .replace: return "replace"
      case .search: return "search"
      case .species: return "species"
      case .split: return "split"
      case .toPrimitive: return "toPrimitive"
      case .toStringTag: return "toStringTag"
      case .unscopables: return "unscopables"
      }
    }
  }
}

extension JavaScriptSymbol: JavaScriptRepresentable {
  public static func fromJavaScriptValue(_ value: borrowing JavaScriptValue) -> JavaScriptSymbol {
    return value.getSymbol()
  }

  public func toJavaScriptValue(in runtime: JavaScriptRuntime) -> JavaScriptValue {
    return asValue()
  }
}

extension JavaScriptSymbol: JSIRepresentable {
  static func fromJSIValue(_ value: borrowing facebook.jsi.Value, in runtime: facebook.jsi.IRuntime) -> JavaScriptSymbol
  {
    fatalError("Not implemented: Use JavaScriptValue.getSymbol() instead")
  }

  func toJSIValue(in runtime: facebook.jsi.IRuntime) -> facebook.jsi.Value {
    return asJSIValue()
  }
}

// MARK: - Cache

extension JavaScriptSymbol {
  /// The global `Symbol` function, `Symbol.for`, and the well-known symbols, cached together in one slot of
  /// the runtime cache. Each well-known symbol is read on its first use only.
  internal final class Cache {
    let constructor: JavaScriptFunction
    let registryFor: JavaScriptFunction

    /// The well-known symbols read so far, indexed by the raw value of `JavaScriptSymbol.WellKnown`.
    @JavaScriptActor
    private var wellKnownSymbols = ContiguousArray<JavaScriptValue.Ref?>(
      repeating: nil,
      count: WellKnown.allCases.count
    )

    @JavaScriptActor
    init(in runtime: borrowing JavaScriptRuntime) throws {
      let constructor = try runtime.global().getPropertyAsFunction("Symbol")
      self.registryFor = try constructor.asObject().getPropertyAsFunction("for")
      self.constructor = constructor
    }

    @JavaScriptActor
    func wellKnown(_ symbol: WellKnown) throws -> JavaScriptSymbol {
      let ref: JavaScriptValue.Ref
      if let cached = wellKnownSymbols[symbol.rawValue] {
        ref = cached
      } else {
        let value = constructor.asObject().getProperty(symbol.propertyName)
        guard value.isSymbol() else {
          throw WellKnownUnavailableError(name: symbol.propertyName)
        }
        ref = value.ref()
        wellKnownSymbols[symbol.rawValue] = ref
      }
      // The ref is created holding a value and nothing takes it out, so the unwrap can't fail.
      return ref.withUnwrappedValue { value in value.getSymbol() }!
    }
  }

  @JavaScriptActor
  private static func cache(in runtime: borrowing JavaScriptRuntime) throws -> Cache {
    return try runtime.cached(JavaScriptRuntime.CacheKeys.symbol) {
      return try Cache(in: runtime)
    }
  }
}

// MARK: - Errors

extension JavaScriptSymbol {
  /// Thrown when the JavaScript engine doesn't define a well-known symbol, for example an engine without
  /// `Symbol.dispose`.
  public struct WellKnownUnavailableError: Error, CustomStringConvertible {
    let name: String

    public var description: String {
      return
        "The JavaScript engine doesn't define 'Symbol.\(name)'. Use an engine version that supports it, or a polyfill that defines it."
    }
  }
}
