// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesJSI

internal final class ClassRegistry {
  // Classes are kept behind `JavaScriptRef` because `JavaScriptObject` is ~Copyable and cannot be a
  // Dictionary value.
  var nativeToJS = [ObjectIdentifier: JavaScriptValue.Ref]()

  // MARK: - Accessing

  func getJavaScriptClass(nativeClassId: ObjectIdentifier) -> JavaScriptObject? {
    return nativeToJS[nativeClassId]?.withUnwrappedValue { (value: borrowing JavaScriptValue) in value.getObject() }
  }

  func getJavaScriptClass(nativeClass: SharedObject.Type) -> JavaScriptObject? {
    let nativeClassId = ObjectIdentifier(nativeClass)
    return getJavaScriptClass(nativeClassId: nativeClassId)
  }

  // MARK: - Registration

  func register(nativeClassId: ObjectIdentifier, javaScriptClass: borrowing JavaScriptObject) {
    nativeToJS[nativeClassId] = javaScriptClass.refToValue()
  }

  func register(nativeClass: SharedObject.Type, javaScriptClass: borrowing JavaScriptObject) {
    let nativeClassId = ObjectIdentifier(nativeClass)
    register(nativeClassId: nativeClassId, javaScriptClass: javaScriptClass)
  }

  internal func clear() {
    nativeToJS.removeAll()
  }
}
