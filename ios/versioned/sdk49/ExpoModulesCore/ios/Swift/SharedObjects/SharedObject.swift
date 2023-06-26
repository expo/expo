// Copyright 2022-present 650 Industries. All rights reserved.

public protocol AnySharedObject: AnyArgument {
  var sharedObjectId: SharedObjectId { get }
}

open class SharedObject: AnySharedObject {
  /**
   An identifier of the native shared object that maps to the JavaScript object.
   When the object is not linked with any JavaScript object, its value is 0.
   */
  public internal(set) var sharedObjectId: SharedObjectId = 0

  /**
   The default public initializer of the shared object.
   */
  public init() {}

  /**
   Returns the JavaScript shared object associated with the native shared object.
   */
  public func getJavaScriptObject() -> JavaScriptObject? {
    return SharedObjectRegistry.toJavaScriptObject(self)
  }
}
