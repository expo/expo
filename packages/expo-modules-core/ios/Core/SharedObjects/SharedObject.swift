// Copyright 2022-present 650 Industries. All rights reserved.

public protocol AnySharedObject: AnyArgument {
  var sharedObjectId: SharedObjectId { get }
}

extension AnySharedObject {
  public static func getDynamicType() -> AnyDynamicType {
    return DynamicSharedObjectType(innerType: Self.self)
  }
}

open class SharedObject: AnySharedObject {
  /**
   An identifier of the native shared object that maps to the JavaScript object.
   When the object is not linked with any JavaScript object, its value is 0.
   */
  public internal(set) var sharedObjectId: SharedObjectId = 0

  /**
   An app context for which the shared object was created.
   */
  public internal(set) weak var appContext: AppContext?

  /**
   The default public initializer of the shared object.
   */
  public init() {}

  /**
   Returns the JavaScript shared object associated with the native shared object.
   */
  public func getJavaScriptObject() -> JavaScriptObject? {
    return appContext?.sharedObjectRegistry.toJavaScriptObject(self)
  }

  /**
   Sends an event with the given name and arguments to the associated JavaScript object.
   NOTE: For now this must be run from the JavaScript thread!
   TODO: Use the runtime executor to ensure running on the proper thread.
   */
  public func sendEvent(name eventName: String, args: AnyArgument...) {
    let jsObject = self.getJavaScriptObject()

    do {
      try jsObject?
        .getProperty("emit")
        .asFunction()
        .call(withArguments: [eventName] + args, thisObject: jsObject, asConstructor: false)
    } catch {
      log.error("Unable to send event '\(eventName)' by shared object of type \(String(describing: Self.self))", error)
    }
  }
}
