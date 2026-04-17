// Copyright 2025-present 650 Industries. All rights reserved.

import Testing
import ExpoModulesJSI

@Suite
@JavaScriptActor
struct JavaScriptErrorTests {
  let runtime = JavaScriptRuntime()

  // MARK: - Basic error creation

  @Test
  func `creates error with message`() {
    let error = JavaScriptError(runtime, message: "Something went wrong")
    let value = error.asValue()

    #expect(value.isObject() == true)
    #expect(value.getObject().getProperty("message").getString() == "Something went wrong")
  }

  // MARK: - JavaScriptThrowable conversion

  @Test
  func `creates error from throwable with message only`() {
    let throwable = SimpleError(message: "Test error")
    let error = JavaScriptError(runtime, from: throwable)
    let object = error.asValue().getObject()

    #expect(object.getProperty("message").getString() == "Test error")
    #expect(object.getProperty("code").isUndefined() == true)
  }

  @Test
  func `creates error from throwable with code`() {
    let throwable = CodedError(message: "Not found", code: "ERR_NOT_FOUND")
    let error = JavaScriptError(runtime, from: throwable)
    let object = error.asValue().getObject()

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

    let result = try runtime.eval("""
      try { failing(); null } catch (e) { [e.message, e.code] }
    """).getArray()
    #expect(result[0].getString() == "Boom")
    #expect(result[1].getString() == "ERR_BOOM")
  }

  @Test
  func `nested host function errors are independent`() throws {
    let outer = runtime.createFunction("outer") { [self] _, _ in
      // Call inner from JS, which throws; JS catches it, then we throw our own error.
      let innerResult = try runtime.eval("""
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

    let result = try runtime.eval("""
      try { outer(); null } catch (e) { [e.message, e.code] }
    """).getArray()
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

