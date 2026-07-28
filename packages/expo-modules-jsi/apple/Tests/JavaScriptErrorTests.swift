// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

@Suite
@JavaScriptActor
struct JavaScriptErrorTests {
  let runtime = JavaScriptRuntime()

  // MARK: - Basic error creation

  @Test
  func `creates error with message`() {
    let error = JavaScriptError(runtime, message: "Something went wrong")
    let value = error.toValue()

    #expect(value.isObject() == true)
    #expect(value.getObject().getProperty("message").getString() == "Something went wrong")
  }

  // MARK: - Wrapping an arbitrary JS value

  @Test
  func `wraps an arbitrary JS value as-is`() {
    // JavaScript can throw any value, not only `Error` instances. Wrapping such a value must
    // preserve it unchanged rather than minting a new `Error` object.
    let thrown = JavaScriptValue(runtime, "just a string")
    let error = JavaScriptError(runtime, value: thrown)

    #expect(error.toValue() == thrown)
    #expect(error.toValue().getString() == "just a string")
  }

  // MARK: - JavaScriptThrowable conversion

  @Test
  func `creates error from throwable with message only`() {
    let throwable = SimpleError(message: "Test error")
    let error = JavaScriptError(runtime, from: throwable)
    let object = error.toValue().getObject()

    #expect(object.getProperty("message").getString() == "Test error")
    #expect(object.getProperty("code").isUndefined() == true)
  }

  @Test
  func `creates error from throwable with code`() {
    let throwable = CodedError(message: "Not found", code: "ERR_NOT_FOUND")
    let error = JavaScriptError(runtime, from: throwable)
    let object = error.toValue().getObject()

    #expect(object.getProperty("message").getString() == "Not found")
    #expect(object.getProperty("code").getString() == "ERR_NOT_FOUND")
  }

  @Test
  func `throwable error can be caught in JavaScript with code`() throws {
    let fn = runtime.createFunction("failing") { _, _ in
      let throwable = CodedError(message: "Boom", code: "ERR_BOOM")
      throw throwable
    }
    runtime.global().setProperty("failing", value: fn)

    let result = try runtime.eval(
      """
        try { failing(); null } catch (e) { [e.message, e.code] }
      """
    ).getArray()
    #expect(result[0].getString() == "Boom")
    #expect(result[1].getString() == "ERR_BOOM")
  }

  @Test
  func `throwing a JavaScriptError from a value throws that value to JavaScript`() throws {
    let fn = runtime.createFunction("failing") { [self] _, _ in
      // Throw a plain string, not an `Error` instance.
      throw JavaScriptError(runtime, value: JavaScriptValue(runtime, "just a string"))
    }
    runtime.global().setProperty("failing", value: fn)

    let result = try runtime.eval(
      """
        try { failing(); null } catch (e) { [typeof e, e instanceof Error, e] }
      """
    ).getArray()
    #expect(result[0].getString() == "string")
    #expect(result[1].getBool() == false)
    #expect(result[2].getString() == "just a string")
  }

  @Test
  func `async function rejecting with a JavaScriptError throws that value to JavaScript`() async throws {
    let fn = runtime.createAsyncFunction("failingAsync") { [self] _, _ in
      // Throw a plain string, not an `Error` instance.
      throw JavaScriptError(runtime, value: JavaScriptValue(runtime, "just a string"))
    }
    runtime.global().setProperty("failingAsync", value: fn)

    let result = try await runtime.evalAsync(
      """
        failingAsync().then(
          () => null,
          (error) => [typeof error, error instanceof Error, error]
        )
      """
    ).getArray()
    #expect(result[0].getString() == "string")
    #expect(result[1].getBool() == false)
    #expect(result[2].getString() == "just a string")
  }

  @Test
  func `throwing a JavaScriptError preserves the thrown object's identity`() throws {
    // Stash an object in JS, then throw it from a host function. The caught value must be the very
    // same object reference, not a copy.
    let thrown = try runtime.eval("({ marker: 'unique' })")
    runtime.global().setProperty("thrown", value: thrown)

    let fn = runtime.createFunction("failing") { [self] _, _ in
      throw JavaScriptError(runtime, value: runtime.global().getProperty("thrown"))
    }
    runtime.global().setProperty("failing", value: fn)

    // JS observes the rejection as the same reference (`===`) and returns the caught value back out.
    let caught = try runtime.eval(
      """
        (function() {
          try { failing(); return null } catch (error) { return error }
        })()
      """
    )
    // Compare from Swift too: `==` is backed by `jsi::Value::strictEquals`, i.e. object identity.
    #expect(caught == thrown)
    #expect(caught.getObject().getProperty("marker").getString() == "unique")
  }

  @Test
  func `throwing a JavaScriptError from a proper Error reaches JavaScript as that Error`() throws {
    let fn = runtime.createFunction("failing") { [self] _, _ in
      let errorValue = JavaScriptError(runtime, message: "boom").toValue()
      throw JavaScriptError(runtime, value: errorValue)
    }
    runtime.global().setProperty("failing", value: fn)

    let result = try runtime.eval(
      """
        try { failing(); null } catch (error) { [error instanceof Error, error.message] }
      """
    ).getArray()
    #expect(result[0].getBool() == true)
    #expect(result[1].getString() == "boom")
  }

  @Test
  func `awaiting a value-rejected promise throws a JavaScriptError carrying that value`() async throws {
    let promise = try JavaScriptPromise(runtime)
    promise.reject(JavaScriptError(runtime, value: JavaScriptValue(runtime, "just a string")))

    let error = await #expect(throws: JavaScriptError.self) {
      try await promise.await()
    }
    #expect(error?.toValue().getString() == "just a string")
  }

  @Test
  func `awaiting a promise rejected with a native error throws a generic Error`() async throws {
    struct TestError: Error, CustomStringConvertible {
      var description: String { "native failure" }
    }
    let promise = try JavaScriptPromise(runtime)
    promise.reject(TestError())

    let error = await #expect(throws: JavaScriptError.self) {
      try await promise.await()
    }
    let caught = try #require(error?.toValue())
    #expect(caught.isObject() == true)
    #expect(caught.getObject().getProperty("message").getString() == "native failure")
  }

  // MARK: - JavaScriptError.from(_:in:) helper

  @Test
  func `from returns an existing JavaScriptError unchanged`() {
    // An existing `JavaScriptError` must be returned as the very same instance so its wrapped
    // value (which may be an arbitrary JS value) reaches JS unchanged.
    let original = JavaScriptError(runtime, value: JavaScriptValue(runtime, "just a string"))
    let result = JavaScriptError.from(original, in: runtime)

    #expect(result === original)
    #expect(result.toValue().getString() == "just a string")
  }

  @Test
  func `from routes a JavaScriptThrowable through the code-preserving initializer`() {
    let throwable = CodedError(message: "Not found", code: "ERR_NOT_FOUND")
    let object = JavaScriptError.from(throwable, in: runtime).toValue().getObject()

    #expect(object.getProperty("message").getString() == "Not found")
    #expect(object.getProperty("code").getString() == "ERR_NOT_FOUND")
  }

  @Test
  func `from stringifies any other native error into a generic Error`() {
    struct TestError: Error, CustomStringConvertible {
      var description: String { "native failure" }
    }
    let object = JavaScriptError.from(TestError(), in: runtime).toValue().getObject()

    #expect(object.getProperty("message").getString() == "native failure")
    #expect(object.getProperty("code").isUndefined() == true)
  }

  @Test
  func `nested host function errors are independent`() throws {
    let outer = runtime.createFunction("outer") { [self] _, _ in
      // Call inner from JS, which throws; JS catches it, then we throw our own error.
      let innerResult = try runtime.eval(
        """
          try { inner(); 'no error' } catch (e) { e.message }
        """)
      #expect(innerResult.getString() == "inner boom")

      throw CodedError(message: "outer boom", code: "ERR_OUTER")
    }
    let inner = runtime.createFunction("inner") { _, _ in
      throw CodedError(message: "inner boom", code: "ERR_INNER")
    }

    runtime.global().setProperty("outer", value: outer)
    runtime.global().setProperty("inner", value: inner)

    let result = try runtime.eval(
      """
        try { outer(); null } catch (e) { [e.message, e.code] }
      """
    ).getArray()
    #expect(result[0].getString() == "outer boom")
    #expect(result[1].getString() == "ERR_OUTER")
  }
}

// MARK: - Test error types

private struct SimpleError: JavaScriptThrowable {
  var message: String
}

private struct CodedError: JavaScriptThrowable {
  var message: String
  var code: String
}
