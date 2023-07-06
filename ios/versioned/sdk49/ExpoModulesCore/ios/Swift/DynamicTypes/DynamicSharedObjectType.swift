// Copyright 2022-present 650 Industries. All rights reserved.

/**
 A dynamic type representing the `SharedObject` type and its subclasses.
 */
internal struct DynamicSharedObjectType: AnyDynamicType {
  let innerType: SharedObject.Type

  /**
   A unique identifier of the wrapped type.
   */
  let typeIdentifier: ObjectIdentifier

  init<SharedObjectType: SharedObject>(innerType: SharedObjectType.Type) {
    self.innerType = innerType
    self.typeIdentifier = ObjectIdentifier(SharedObjectType.self)
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
    throw NativeSharedObjectNotFoundException()
  }

  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
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
