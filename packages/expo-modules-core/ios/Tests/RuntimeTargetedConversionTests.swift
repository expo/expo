// Copyright 2026-present 650 Industries. All rights reserved.

import Testing
import ExpoModulesJSI

@testable import ExpoModulesCore

// Verifies that native→JS conversion creates JS values in the runtime passed via `in:`,
// not the app context's main runtime. Useful for Worklet runtime
@Suite("RuntimeTargetedConversion")
@JavaScriptActor
struct RuntimeTargetedConversionTests {
  let appContext = AppContext.create()
  let secondaryRuntime = JavaScriptRuntime()

  @Test
  func `Any return dispatches dictionary into the target runtime`() throws {
    let dict: [String: Int] = ["start": 7, "end": 12]
    let jsValue = try appContext.converter.toJS(dict, ~Any.self, in: secondaryRuntime)

    secondaryRuntime.global().setProperty("__t", value: jsValue)
    #expect(try secondaryRuntime.eval("__t.start").getInt() == 7)
    #expect(try secondaryRuntime.eval("__t.end").getInt() == 12)
  }

  @Test
  func `array of dicts lives in the target runtime`() throws {
    let array: [[String: Int]] = [["start": 7, "end": 12]]
    let jsValue = try appContext.converter.toJS(array, ~[[String: Int]].self, in: secondaryRuntime)

    secondaryRuntime.global().setProperty("__t", value: jsValue)
    #expect(try secondaryRuntime.eval("__t.length").getInt() == 1)
    #expect(try secondaryRuntime.eval("__t[0].start").getInt() == 7)
    #expect(try secondaryRuntime.eval("__t[0].end").getInt() == 12)
  }

  @Test
  func `string lives in the target runtime`() throws {
    let jsValue = try appContext.converter.toJS("expo", ~String.self, in: secondaryRuntime)
    secondaryRuntime.global().setProperty("__t", value: jsValue)
    #expect(try secondaryRuntime.eval("__t").getString() == "expo")
  }

  @Test
  func `number lives in the target runtime`() throws {
    let jsValue = try appContext.converter.toJS(42, ~Int.self, in: secondaryRuntime)
    secondaryRuntime.global().setProperty("__t", value: jsValue)
    #expect(try secondaryRuntime.eval("__t").getInt() == 42)
  }

  @Test
  func `bool lives in the target runtime`() throws {
    let jsValue = try appContext.converter.toJS(true, ~Bool.self, in: secondaryRuntime)
    secondaryRuntime.global().setProperty("__t", value: jsValue)
    #expect(try secondaryRuntime.eval("__t").getBool() == true)
  }

  @Test
  func `null lives in the target runtime`() throws {
    let value: Int? = nil
    let jsValue = try appContext.converter.toJS(value as Any, ~Int?.self, in: secondaryRuntime)
    secondaryRuntime.global().setProperty("__t", value: jsValue)
    #expect(try secondaryRuntime.eval("__t").isNull() == true)
  }

  @Test
  func `undefined lives in the target runtime`() throws {
    let jsValue = try appContext.converter.toJS((), ~Void.self, in: secondaryRuntime)
    secondaryRuntime.global().setProperty("__t", value: jsValue)
    #expect(try secondaryRuntime.eval("__t").isUndefined() == true)
  }
}
