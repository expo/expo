// Copyright 2021-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/// `BaseModule` is just a stub class that fulfils `AnyModule` protocol requirement of public default initializer,
/// but doesn't implement that protocol explicitly, though — it would have to provide a definition which would require
/// other modules to use `override` keyword in the function returning the definition.
open class BaseModule {
  public private(set) weak var appContext: AppContext?

  @available(
    *, unavailable,
    message: "Module's initializer cannot be overridden, override the \"didCreate\" lifecycle hook instead."
  )
  public init() {}

  required public init(appContext: AppContext) {
    self.appContext = appContext
  }

  /**
   Sends an event with given name and body to JavaScript.
   */
  public func sendEvent(_ eventName: String, _ body: [String: Any?] = [:]) {
    appContext?.eventEmitter?.sendEvent(withName: eventName, body: body)
  }

  // MARK: - Lifecycle hooks

  // No-op defaults for the `AnyModule` lifecycle hooks. They are declared here as `open`
  // class methods rather than only as protocol-extension defaults, so that they dispatch
  // dynamically: a subclass override is called even when the `Module` conformance comes
  // from an ancestor that doesn't implement the hook itself.

  /// A lifecycle hook that is called once the module is initialized and registered in the app context.
  /// An equivalent of the `OnCreate` DSL component.
  open func didCreate() {}

  /// A lifecycle hook that is called when the module is about to be deallocated.
  /// An equivalent of the `OnDestroy` DSL component.
  open func willDestroy() {}

  /// A lifecycle hook that is called when the first JavaScript listener for the given event is added.
  /// An equivalent of the `OnStartObserving` DSL component.
  open func didStartListening(event: String) {}

  /// A lifecycle hook that is called when the last JavaScript listener for the given event is removed.
  /// An equivalent of the `OnStopObserving` DSL component.
  open func didStopListening(event: String) {}
}

extension BaseModule: EventEmitter {
  /**
   Lends the module's JavaScript object, looked up from the module registry, for the duration of `body`.
   */
  @JavaScriptActor
  public func withEventTarget<R>(_ body: (borrowing JavaScriptObject) throws -> R) rethrows -> R? {
    guard let appContext else {
      return nil
    }
    let holder = appContext.moduleRegistry.first { $0.module === self }

    return try holder?.withEventTarget(body) ?? nil
  }
}

/// An alias for `AnyModule` extended by the `BaseModule` class that provides public default initializer.
public typealias Module = AnyModule & BaseModule
