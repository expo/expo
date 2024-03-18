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
}

// Unfortunately the `emit` function needs to be defined in the extension.
// When put in the class, pack expansion is crashing with `EXC_BAD_ACCESS` code.
// See https://github.com/apple/swift/issues/72381 for more details.
public extension SharedObject { // swiftlint:disable:this no_grouping_extension
  // Parameter packs feature requires Swift 5.9 (Xcode 15.0), but some CIs and EAS images may still use older versions.
  // As of April 29, all submissions must be made with Xcode 15, so hopefully we can remove this condition soon.
  // No one should use <15.0 these days.
  #if swift(>=5.9)
  /**
   Schedules an event with the given name and arguments to be emitted to the associated JavaScript object.
   */
  public func emit<each A: AnyArgument>(event: String, arguments: repeat each A) {
    guard let appContext, let runtime = try? appContext.runtime else {
      log.warn("Trying to send event '\(event)' to \(type(of: self)), but the JS runtime has been lost")
      return
    }

    // Collect arguments and their dynamic types from parameter pack
    var argumentPairs: [(AnyArgument, AnyDynamicType)] = []
    repeat argumentPairs.append((each arguments, ~(each A).self))

    // Schedule the event to be asynchronously emitted from the runtime's thread
    runtime.schedule { [weak self, weak appContext] in
      guard let appContext, let runtime = try? appContext.runtime, let jsObject = self?.getJavaScriptObject() else {
        log.warn("Trying to send event '\(event)' to \(type(of: self)), but the JS object is no longer associated with the native instance")
        return
      }

      // Convert native arguments to JS, just like function results
      let arguments = argumentPairs.map { argument, dynamicType in
        return Conversions.convertFunctionResult(argument, appContext: appContext, dynamicType: dynamicType)
      }

      JSIUtils.emitEvent(event, to: jsObject, withArguments: arguments, in: runtime)
    }
  }
  #else // swift(>=5.9)
  @available(*, unavailable, message: "Unavailable in Xcode <15.0")
  public func emit(event: String, arguments: AnyArgument...) {
    fatalError("Emitting events to JS requires at least Xcode 15.0")
  }
  #endif // swift(<5.9)
}
