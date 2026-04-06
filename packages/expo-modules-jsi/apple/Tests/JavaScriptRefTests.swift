// Copyright 2025-present 650 Industries. All rights reserved.

import Testing
import ExpoModulesJSI

@Suite
@JavaScriptActor
struct JavaScriptRefTests {
  let runtime = JavaScriptRuntime()

  // MARK: - Initialization

  @Test
  func `init without value creates empty ref`() {
    let ref = JavaScriptRef<JavaScriptValue>()
    #expect(ref.isEmpty == true)
  }

  @Test
  func `init with value creates non-empty ref`() {
    let value = JavaScriptValue.number(42)
    let ref = JavaScriptRef(value)
    #expect(ref.isEmpty == false)
  }

  // MARK: - take() throwing

  @Test
  func `take returns the value`() throws {
    let ref = JavaScriptRef(JavaScriptValue(runtime, "hello"))
    let value: JavaScriptValue = try ref.take()
    #expect(value.getString() == "hello")
  }

  @Test
  func `take invalidates the ref`() throws {
    let ref = JavaScriptRef(JavaScriptValue.true())
    let _: JavaScriptValue = try ref.take()
    #expect(ref.isEmpty == true)
  }

  @Test
  func `take throws InvalidRefError when already taken`() throws {
    let ref = JavaScriptRef(JavaScriptValue.number(1))
    let _: JavaScriptValue = try ref.take()

    #expect(throws: JavaScriptRef<JavaScriptValue>.InvalidRefError.self) {
      let _: JavaScriptValue = try ref.take()
    }
  }

  @Test
  func `take throws InvalidRefError on empty ref`() {
    let ref = JavaScriptRef<JavaScriptValue>()

    #expect(throws: JavaScriptRef<JavaScriptValue>.InvalidRefError.self) {
      let _: JavaScriptValue = try ref.take()
    }
  }

  // MARK: - take() optional

  @Test
  func `optional take returns value`() {
    let ref = JavaScriptRef(JavaScriptValue.number(99))
    let value: JavaScriptValue? = ref.take()
    #expect(value?.getInt() == 99)
  }

  @Test
  func `optional take returns nil when already taken`() {
    let ref = JavaScriptRef(JavaScriptValue.number(1))
    let _: JavaScriptValue? = ref.take()
    let second: JavaScriptValue? = ref.take()
    #expect(second == nil)
  }

  @Test
  func `optional take returns nil on empty ref`() {
    let ref = JavaScriptRef<JavaScriptValue>()
    let value: JavaScriptValue? = ref.take()
    #expect(value == nil)
  }

  // MARK: - reset

  @Test
  func `reset replaces value`() throws {
    let ref = JavaScriptRef(JavaScriptValue.number(1))
    ref.reset(JavaScriptValue.number(2))

    let value: JavaScriptValue = try ref.take()
    #expect(value.getInt() == 2)
  }

  @Test
  func `reset on empty ref sets value`() throws {
    let ref = JavaScriptRef<JavaScriptValue>()
    ref.reset(JavaScriptValue(runtime, "set"))

    #expect(ref.isEmpty == false)
    let value: JavaScriptValue = try ref.take()
    #expect(value.getString() == "set")
  }

  // MARK: - release

  @Test
  func `release makes ref empty`() {
    let ref = JavaScriptRef(JavaScriptValue.number(1))
    ref.release()
    #expect(ref.isEmpty == true)
  }

  @Test
  func `take throws after release`() {
    let ref = JavaScriptRef(JavaScriptValue.number(1))
    ref.release()

    #expect(throws: JavaScriptRef<JavaScriptValue>.InvalidRefError.self) {
      let _: JavaScriptValue = try ref.take()
    }
  }

  // MARK: - asValue

  @Test
  func `asValue returns the value`() {
    let ref = JavaScriptRef(JavaScriptValue.number(42))
    let value = ref.asValue()
    #expect(value.getInt() == 42)
  }

  @Test
  func `asValue returns undefined on empty ref`() {
    let ref = JavaScriptRef<JavaScriptValue>()
    let value = ref.asValue()
    #expect(value.isUndefined() == true)
  }

  @Test
  func `asValue consumes the ref`() {
    let ref = JavaScriptRef(JavaScriptValue.number(1))
    _ = ref.asValue()
    #expect(ref.isEmpty == true)
  }

  // MARK: - InvalidRefError

  @Test
  func `InvalidRefError description includes type name`() {
    let error = JavaScriptRef<JavaScriptValue>.InvalidRefError()
    #expect(error.description.contains("JavaScriptValue"))
  }

  // MARK: - Object refs

  @Test
  func `works with JavaScriptObject`() throws {
    let object = runtime.createObject()
    object.setProperty("key", value: "value")

    let ref = JavaScriptRef(object)
    let taken: JavaScriptObject = try ref.take()
    #expect(taken.getProperty("key").getString() == "value")
  }
}
