// Copyright 2021-present 650 Industries. All rights reserved.

/**
 An alias for type-erased callback handler.
 */
typealias AnyCallbackHandlerType = (Any) -> Void

/**
 Public type-erased protocol that `Callback` object conforms to.
 */
public protocol AnyCallback {
  /**
   Initializes an empty callback (no-op).
   */
  init()
}

/**
 Internal type-erased protocol for `Callback` object.
 */
internal protocol AnyCallbackInternal: AnyCallback {
  /**
   Sets the callback handler. By default the callback
   is not settled which means it has no handler, thus is no-op.
   */
  func settle(_ handler: @escaping AnyCallbackHandlerType)

  /**
   Invalidates the callback, making its handler no-op.
   */
  func invalidate()
}

/**
 Callable object that represents a JavaScript function.
 */
public class Callback<ArgType>: AnyCallback, AnyCallbackInternal {
  /**
   The underlying closure to invoke when the callback is called.
   */
  private var handler: AnyCallbackHandlerType?

  // MARK: AnyCallback

  public required init() {}

  // MARK: AnyCallbackInternal

  internal func settle(_ handler: @escaping AnyCallbackHandlerType) {
    self.handler = handler
  }

  internal func invalidate() {
    self.handler = nil
  }

  // MARK: Calling as function

  /**
   Allows the callback instance to be called as a function.
   */
  public func callAsFunction(_ arg: ArgType) {
    // TODO: Convert records to dictionaries (@tsapeta)
    handler?(arg as Any)
  }
}
