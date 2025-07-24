// Copyright 2022-present 650 Industries. All rights reserved.

/**
 A dynamic type representing the `SharedObject` type and its subclasses.
 */
internal struct DynamicSharedObjectType: AnyDynamicType {
  let innerType: AnySharedObject.Type

  /**
   A unique identifier of the wrapped type.
   */
  var typeIdentifier: ObjectIdentifier {
    return ObjectIdentifier(innerType)
  }

  init(innerType: AnySharedObject.Type) {
    self.innerType = innerType
  }

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return innerType == InnerType.self
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    if let sharedObjectType = type as? Self {
      return sharedObjectType.innerType == innerType
    }
    return false
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    if let value = value as? SharedObject {
      // Given value is a shared object already
      return value
    }

    // If the given value is a shared object id, search the registry for its native representation
    if let sharedObjectId = value as? SharedObjectId,
      let nativeSharedObject = appContext.sharedObjectRegistry.get(sharedObjectId)?.native {
      return nativeSharedObject
    }
    throw NativeSharedObjectNotFoundException()
  }

  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    if jsValue.kind == .number {
      let sharedObjectId = jsValue.getInt() as SharedObjectId

      guard let nativeSharedObject = appContext.sharedObjectRegistry.get(sharedObjectId)?.native else {
        throw NativeSharedObjectNotFoundException()
      }
      return nativeSharedObject
    }
    if let jsObject = try? jsValue.asObject(),
      let nativeSharedObject = appContext.sharedObjectRegistry.toNativeObject(jsObject) {
      return nativeSharedObject
    }
    throw NativeSharedObjectNotFoundException()
  }

  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any {
    // Postpone object creation to execute on the JS thread.
    JavaScriptSharedObjectBinding.init {
      // If the result is a native shared object, create its JS representation and add the pair to the registry of shared objects.
      if let sharedObject = result as? SharedObject {
        // If the JS object already exists, just return it.
        if let jsObject = sharedObject.getJavaScriptObject() {
          return jsObject
        }
        guard let jsObject = try? appContext.newObject(nativeClassId: typeIdentifier) else {
          // Throwing is not possible here due to swift-objC interop.
          log.warn("Unable to create a JS object for \(description)")
          return JavaScriptObject()
        }

        // Add newly created objects to the registry.
        appContext.sharedObjectRegistry.add(native: sharedObject, javaScript: jsObject)

        return jsObject
      }
      return JavaScriptObject()
    }
  }

  var description: String {
    return "SharedObject<\(innerType)>"
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    if let value = value as? JavaScriptSharedObjectBinding {
      return try JavaScriptValue.from(value.get(), runtime: appContext.runtime)
    }
    throw NativeSharedObjectNotFoundException()
  }
}

internal final class NativeSharedObjectNotFoundException: Exception {
  override var reason: String {
    "Unable to find the native shared object associated with given JavaScript object"
  }
}
