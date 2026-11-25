// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/// The base class of the `@JSClass` classes that emit events. The JavaScript class of a subclass extends
/// `expo.EventEmitter`, so its objects keep event listeners, and the native instance emits events to them.
///
///     @JSClass
///     public final class Timer: BaseEventEmitter {
///       @JS
///       init(interval: Double) { ... }
///
///       @JS
///       func start() { ... }
///
///       private func tick() {
///         emit(event: "tick")
///       }
///     }
///
/// JavaScript gets an instance only from the constructor of the class. The instance emits events only while its
/// JavaScript object is alive. An event emitted before the constructor returns, for example from the initializer, is
/// dropped. Unlike a shared object, the instance has no registry ID.
open class BaseEventEmitter: AnyJavaScriptClass, JavaScriptDecodable {
  /// The app context of the JavaScript object. The JavaScript constructor sets it.
  public private(set) weak var appContext: AppContext?

  /// The native state of the JavaScript object, or `nil` before the constructor attaches it and after the object is
  /// collected.
  ///
  /// The reference is strong: a weak reference would give the native state a side table, which makes every retain and
  /// release of it slower, also when a JS method finds it on its JS object. The native state holds this instance too, so
  /// its deallocator ends the pair when the JS object is collected. The deallocator can run on another thread than
  /// `withEventTarget`, so the reference is behind a lock. Use it only under the lock.
  private var pairedNativeState: BaseEventEmitterNativeState?

  public init() {}

  // MARK: - Hooks of the JavaScript class

  /// The name of the class in JavaScript. Overridden by the `@JSClass` macro.
  open class var _jsName: String {
    return unqualifiedTypeName(self)
  }

  /// `nil`, because no macro gives this class its JavaScript class. Overridden by the `@JSClass` macro.
  open class var _jsClassType: (any AnyJavaScriptClass.Type)? {
    return nil
  }

  /// `nil`, because core builds the JavaScript class of a subclass on `expo.EventEmitter`. Overridden by the
  /// `@JSClass` macro with `super._jsClassType`.
  open class var _jsSuperclassType: (any AnyJavaScriptClass.Type)? {
    return nil
  }

  /// Overridden by the `@JSClass` macro. The methods of `expo.EventEmitter` are on its prototype already.
  @JavaScriptActor
  open class func _decorateClass(prototype: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {}

  /// Overridden by the `@JSClass` macro.
  @JavaScriptActor
  open class func _decorateClass(constructor: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {}

  /// Overridden by the `@JSClass` macro from the `@JS init` of the class.
  @JavaScriptActor
  open class func _constructInstance(
    this: borrowing JavaScriptValue,
    arguments: borrowing JavaScriptValuesBuffer,
    in runtime: JavaScriptRuntime
  ) throws -> (any AnyJavaScriptClass)? {
    return nil
  }

  // MARK: - Pairing with the JavaScript object

  /// Attaches a native state that keeps the event listeners and `object`, so that this instance emits events to it. The
  /// JavaScript constructor calls it. Returns `false` when the engine doesn't allow a native state on the object.
  @JavaScriptActor
  internal func attachNativeState(
    to object: borrowing JavaScriptObject,
    appContext: AppContext,
    in runtime: JavaScriptRuntime
  ) -> Bool {
    let nativeState = BaseEventEmitterNativeState(instance: self, object: object, in: runtime)
    guard object.trySetNativeState(nativeState) else {
      return false
    }
    self.appContext = appContext
    SharedObjectLock.withLock(for: self) {
      pairedNativeState = nativeState
    }
    return true
  }

  /// Ends the pair with the native state, when it is the paired one. Its deallocator calls it when the JavaScript object
  /// is collected.
  fileprivate func endPairing(with nativeState: BaseEventEmitterNativeState) {
    let oldValue: BaseEventEmitterNativeState? = SharedObjectLock.withLock(for: self) {
      guard pairedNativeState === nativeState else {
        return nil
      }
      let oldValue = pairedNativeState
      pairedNativeState = nil
      return oldValue
    }
    // The old native state can be deallocated here, so it is released after the lock is unlocked.
    withExtendedLifetime(oldValue) {}
  }
}

extension BaseEventEmitter: EventEmitter {
  @JavaScriptActor
  public func withEventTarget<R>(_ body: (borrowing JavaScriptObject) throws -> R) rethrows -> R? {
    let nativeState = SharedObjectLock.withLock(for: self) {
      return pairedNativeState
    }
    guard let target = nativeState?.object.lock() else {
      return nil
    }
    return try body(target)
  }
}

/// The native state of the JavaScript object of a `BaseEventEmitter` subclass. Its runtime is the main runtime.
///
/// `@unchecked Sendable`: the JavaScript object and the listeners are used only on the thread of the runtime.
internal final class BaseEventEmitterNativeState: EventEmitterNativeState, @unchecked Sendable {
  /// The JavaScript object, held weakly, because the object holds this native state.
  let object: JavaScriptWeakObject

  init(instance: BaseEventEmitter, object: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) {
    self.object = object.createWeak()
    super.init(primaryRuntimeId: runtime.id, instance: instance)
    setDeallocator { nativeState in
      let nativeState = unsafeDowncast(nativeState, to: BaseEventEmitterNativeState.self)
      unsafeDowncast(nativeState.instance.unsafelyUnwrapped as AnyObject, to: BaseEventEmitter.self)
        .endPairing(with: nativeState)
    }
  }
}
