// Copyright 2021-present 650 Industries. All rights reserved.

/**
 Internal type-erased protocol for the instances of the `Event` property wrapper.
 */
internal protocol AnyEventInternal {
  /**
   Sets the handler on the wrapped callback.
   */
  func settle(_ handler: @escaping AnyCallbackHandlerType)

  /**
   Invalidates the callback.
   */
  func invalidate()
}

/**
 The class used as a property wrapper on view's or object's callbacks.
 */
@propertyWrapper
public final class Event<CallbackType: AnyCallback>: AnyEventInternal {
  public var wrappedValue: CallbackType

  /**
   The property wrapper initializer. The wrapped value falls back to the empty callback.
   */
  public init(wrappedValue: CallbackType = CallbackType()) {
    self.wrappedValue = wrappedValue
  }

  internal func settle(_ handler: @escaping AnyCallbackHandlerType) {
    if let callback = wrappedValue as? AnyCallbackInternal {
      callback.settle(handler)
    }
  }

  internal func invalidate() {
    if let callback = wrappedValue as? AnyCallbackInternal {
      callback.invalidate()
    }
  }
}
