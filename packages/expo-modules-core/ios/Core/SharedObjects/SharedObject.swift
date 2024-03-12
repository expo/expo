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
   Schedules an event with the given name and arguments to be sent to the associated JavaScript object.
   */
  public func sendEvent(name eventName: String, args: AnyArgument...) {
    guard let runtime = try? appContext?.runtime else {
      log.warn("Trying to send event '\(eventName)' to \(type(of: self)), but the JS runtime has been lost")
      return
    }
    runtime.schedule { [weak self] in
      guard let self, let jsObject = self.getJavaScriptObject() else {
        log.warn("Trying to send event '\(eventName)' to \(type(of: self)), but the JS object is no longer associated with the native instance")
        return
      }
      do {
        try jsObject
          .getProperty("emit")
          .asFunction()
          .call(withArguments: [eventName] + args, thisObject: jsObject, asConstructor: false)
      } catch {
        log.error("Unable to send event '\(eventName)' to \(type(of: self)):", error)
      }
    }
  }
}
