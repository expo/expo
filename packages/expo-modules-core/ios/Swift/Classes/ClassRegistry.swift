// Copyright 2023-present 650 Industries. All rights reserved.

internal final class ClassRegistry {
  var nativeToJS = [ObjectIdentifier: JavaScriptWeakObject]()

  // MARK: - Accessing

  func getJavaScriptClass(nativeClassId: ObjectIdentifier) -> JavaScriptObject? {
    return nativeToJS[nativeClassId]?.lock()
  }

  func getJavaScriptClass(nativeClass: SharedObject.Type) -> JavaScriptObject? {
    let nativeClassId = ObjectIdentifier(nativeClass)
    return getJavaScriptClass(nativeClassId: nativeClassId)
  }

  // MARK: - Registration

  func register(nativeClassId: ObjectIdentifier, javaScriptClass: JavaScriptObject) {
    nativeToJS[nativeClassId] = javaScriptClass.createWeak()
  }

  func register(nativeClass: SharedObject.Type, javaScriptClass: JavaScriptObject) {
    let nativeClassId = ObjectIdentifier(nativeClass)
    register(nativeClassId: nativeClassId, javaScriptClass: javaScriptClass)
  }

  internal func clear() {
    nativeToJS.removeAll()
  }
}
