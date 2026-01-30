// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesJSI

internal final class ClassRegistry {
//  var nativeToJS = [ObjectIdentifier: JavaScriptWeakObject]()

  // MARK: - Accessing

  func getJavaScriptClass(nativeClassId: ObjectIdentifier) -> JavaScriptObject? {
//    return nativeToJS[nativeClassId]?.lock()
    return nil
  }

  func getJavaScriptClass(nativeClass: SharedObject.Type) -> JavaScriptObject? {
//    let nativeClassId = ObjectIdentifier(nativeClass)
//    return getJavaScriptClass(nativeClassId: nativeClassId)
    return nil
  }

  // MARK: - Registration

  func register(nativeClassId: ObjectIdentifier, javaScriptClass: borrowing JavaScriptObject) {
//    nativeToJS[nativeClassId] = javaScriptClass.createWeak()
  }

  func register(nativeClass: SharedObject.Type, javaScriptClass: borrowing JavaScriptObject) {
//    let nativeClassId = ObjectIdentifier(nativeClass)
//    register(nativeClassId: nativeClassId, javaScriptClass: javaScriptClass)
  }

  internal func clear() {
//    nativeToJS.removeAll()
  }
}
