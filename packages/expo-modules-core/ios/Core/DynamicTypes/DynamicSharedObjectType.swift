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
    if let value = value as? SharedObject, type(of: value) == innerType {
      // Given value is a shared object already
      return value
    }

    // If the given value is a shared object id, search the registry for its native representation
    if let sharedObjectId = value as? SharedObjectId,
       let nativeSharedObject = SharedObjectRegistry.get(sharedObjectId)?.native {
      return nativeSharedObject
    }
    throw NativeSharedObjectNotFoundException()
  }

  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    if jsValue.kind == .number {
      let sharedObjectId = jsValue.getInt() as SharedObjectId

      guard let nativeSharedObject = SharedObjectRegistry.get(sharedObjectId)?.native else {
        throw NativeSharedObjectNotFoundException()
      }
      return nativeSharedObject
    }
    if let jsObject = try? jsValue.asObject(),
       let nativeSharedObject = SharedObjectRegistry.toNativeObject(jsObject) {
      return nativeSharedObject
    }
    throw NativeSharedObjectNotFoundException()
  }

  var description: String {
    return "SharedObject<\(innerType)>"
  }
}

internal final class NativeSharedObjectNotFoundException: Exception {
  override var reason: String {
    "Unable to find the native shared object associated with given JavaScript object"
  }
}
