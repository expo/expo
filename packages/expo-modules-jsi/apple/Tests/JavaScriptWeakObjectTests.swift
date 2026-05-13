// Copyright 2025-present 650 Industries. All rights reserved.

import Testing
import ExpoModulesJSI

@Suite
@JavaScriptActor
struct JavaScriptWeakObjectTests {
  let runtime = JavaScriptRuntime()
  @Test
  func `initializes from JavaScriptObject`() {
    let object = runtime.createObject()
    let weakObject = JavaScriptWeakObject(runtime, object)

    // Should be able to lock and get the object back
    guard let lockedObject = weakObject.lock() else {
      Issue.record("Expected weak object to return a locked object, but got nil")
      return
    }
    // Success - we got the object back
    #expect((lockedObject == object) == true)
  }

  @Test
  func `lock returns object when still alive`() {
    let object = runtime.createObject()
    object.setProperty("test", value: 42)

    let weakObject = JavaScriptWeakObject(runtime, object)

    // Object is still alive, lock should return it
    if let lockedObject = weakObject.lock() {
      // Verify it's the same object
      let value = lockedObject.getProperty("test")
      #expect(value.getInt() == 42)
    } else {
      Issue.record("Expected weak object to return a locked object, but got nil")
    }
  }

  @Test
  func `lock returns nil when object is collected`() async throws {
    var weakObject: JavaScriptWeakObject? = nil

    // Create object in a scope so it can be collected
    do {
      let object = runtime.createObject()
      object.setProperty("test", value: 123)
      weakObject = JavaScriptWeakObject(runtime, object)

      // Object should be accessible initially
      if weakObject?.lock() == nil {
        Issue.record("Expected weak object to return a locked object initially")
      }
    }

    #expect((weakObject?.lock() != nil) == true)

    // Force garbage collection
    _ = try! runtime.eval("gc() && gc() && gc()")

    // Object should be collected now
    // Note: This test may be flaky depending on GC behavior
    // In practice, lock() should return nil after GC, but timing may vary
    #expect((weakObject?.lock() == nil) == true)
  }

  @Test
  func `asValue returns undefined when object is gone`() throws {
    var weakObject: JavaScriptWeakObject? = nil

    do {
      let object = runtime.createObject()
      weakObject = JavaScriptWeakObject(runtime, object)

      // Initially should return a valid value
      let value = weakObject?.asValue()
      #expect(value?.isObject() == true)
    }

    // Force garbage collection
    _ = try! runtime.eval("gc() && gc() && gc()")

    // After collection, asValue should return undefined
    // Note: This test may be flaky depending on GC behavior
    #expect(weakObject?.asValue().isUndefined() == true)
  }

  @Test
  func `multiple weak references to same object`() {
    let object = runtime.createObject()
    object.setProperty("value", value: "shared")

    let weakObject1 = JavaScriptWeakObject(runtime, object)
    let weakObject2 = JavaScriptWeakObject(runtime, object)

    // Both should lock to the same object
    if let locked1 = weakObject1.lock(), let locked2 = weakObject2.lock() {
      // Both should have the same property
      #expect(locked1.getProperty("value").getString() == "shared")
      #expect(locked2.getProperty("value").getString() == "shared")
    } else {
      Issue.record("Expected both weak objects to return locked objects")
    }
  }

  @Test
  func `asValue returns valid object when locked`() {
    let object = runtime.createObject()
    object.setProperty("name", value: "test")

    let weakObject = JavaScriptWeakObject(runtime, object)
    let value = weakObject.asValue()

    #expect(value.isObject() == true)
    #expect(value.getObject().getProperty("name").getString() == "test")
  }
}
