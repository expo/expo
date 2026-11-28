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
/// JavaScript gets an instance only from the constructor of the class. The instance emits events to the runtime of its
/// JavaScript object, and only while that object is alive. An event emitted before the constructor returns, for example
/// from the initializer, is dropped. Unlike a shared object, the instance has no registry ID and no app context.
open class BaseEventEmitter: AnyJavaScriptClass, JavaScriptDecodable {
  public typealias NativeState = BaseEventEmitterNativeState

  /// The native state of the JavaScript object, or `nil` before the constructor attaches it and after the object is
  /// collected.
  ///
  /// The reference is strong: a weak reference would give the native state a side table, which makes every retain and
  /// release of it slower, also when a JS method finds it on its JS object. The native state holds this instance too,
  /// so its deallocator ends the pair when the JS object is collected. `emit` reads it on any thread, so it is behind a
  /// lock. Use it only under the lock.
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

  /// Creates a native state that keeps the event listeners and `object`, and pairs `instance` with it, so that the
  /// instance emits events to the object.
  @JavaScriptActor
  public static func makeNativeState(
    for instance: BaseEventEmitter,
    object: borrowing JavaScriptObject,
    in runtime: JavaScriptRuntime
  ) -> BaseEventEmitterNativeState {
    let nativeState = BaseEventEmitterNativeState(instance: instance, object: object, in: runtime)
    SharedObjectLock.withLock(for: instance) {
      instance.pairedNativeState = nativeState
    }
    return nativeState
  }

  // MARK: - Pairing with the JavaScript object

  /// The reference that an event emitted now is dispatched through: the native state, or `nil` when the instance isn't
  /// paired. See `EventEmitterReference`.
  @usableFromInline
  internal var eventEmitterReference: EventEmitterReference {
    return .baseEventEmitter(SharedObjectLock.withLock(for: self) { pairedNativeState })
  }

  /// Ends the pair with the native state, when it is the paired one. Its deallocator calls it when the JavaScript
  /// object is collected, or when the engine doesn't allow the native state on the object.
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
  /// `nil`: the instance emits to the runtime of its JavaScript object, which its native state keeps.
  public var appContext: AppContext? {
    return nil
  }

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

/// The native state of the JavaScript object of a `BaseEventEmitter` subclass.
///
/// `@unchecked Sendable`: the JavaScript object and the listeners are used only on the thread of the runtime. The
/// runtime is a weak reference, which is safe to read on any thread.
public final class BaseEventEmitterNativeState: EventEmitterNativeState, @unchecked Sendable {
  /// The JavaScript object, held weakly, because the object holds this native state.
  let object: JavaScriptWeakObject

  /// The runtime of the JavaScript object, which `emit` schedules events on. Weak, so that the native state doesn't
  /// keep a destroyed runtime.
  private(set) weak var runtime: JavaScriptRuntime?

  init(instance: BaseEventEmitter, object: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) {
    self.object = object.createWeak()
    self.runtime = runtime
    super.init(primaryRuntimeId: runtime.id, instance: instance)
    setDeallocator { nativeState in
      let nativeState = unsafeDowncast(nativeState, to: BaseEventEmitterNativeState.self)
      unsafeDowncast(nativeState.instance.unsafelyUnwrapped as AnyObject, to: BaseEventEmitter.self)
        .endPairing(with: nativeState)
    }
  }

  /// The runtime to schedule an event of `emitterType` on, or `nil` after logging a warning when it was destroyed.
  @usableFromInline
  func eventRuntime(forEvent event: String, emitterType: Any.Type) -> JavaScriptRuntime? {
    guard let runtime else {
      warnRuntimeLost(event: event, emitterType: emitterType)
      return nil
    }
    return runtime
  }

  /// Calls the listeners of the event in `runtime` with the payload, and the JavaScript object as `this`. Does nothing
  /// when the event has no listeners or the object was collected.
  @JavaScriptActor
  func dispatchEvent(event: String, payload: borrowing JavaScriptValue, in runtime: JavaScriptRuntime) {
    guard let eventListeners = listeners(in: runtime)?.listeners(of: event), let target = object.lock() else {
      return
    }
    EventListeners.call(eventListeners, this: target, payload: payload, in: runtime)
  }
}
