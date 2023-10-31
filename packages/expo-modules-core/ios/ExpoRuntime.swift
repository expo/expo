/**
 Property name of the core object in the global scope of the Expo JS runtime.
 */
private let coreObjectPropertyName = "expo"

@objc(EXRuntime)
public final class ExpoRuntime: JavaScriptRuntime {
  /**
   The core object of the Expo runtime that is used to scope native Expo-specific functionalities.
   It gets installed into the runtime as the `global.expo` object.
   */
  @objc
  public private(set) var coreObject: JavaScriptObject?

  internal func initializeCoreObject(_ coreObject: JavaScriptObject) throws {
    guard self.coreObject == nil else {
      throw CoreObjectInitializedException()
    }
    self.coreObject = coreObject
    global().defineProperty(coreObjectPropertyName, value: coreObject, options: .enumerable)
  }
}

private final class CoreObjectInitializedException: Exception {
  override var reason: String {
    "The core Expo object was already initialized"
  }
}
