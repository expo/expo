// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

// MARK: - Test classes and module

@JSClass
private final class JSClassPoint {
  let x: Double
  let y: Double

  @JS
  init(x: Double, y: Double) {
    self.x = x
    self.y = y
  }

  // An argument of the class.
  @JS
  func distance(to other: JSClassPoint) -> Double {
    return ((x - other.x) * (x - other.x) + (y - other.y) * (y - other.y)).squareRoot()
  }
}

@JSClass
private class JSClassShape {
  let name: String

  @JS
  init(name: String) {
    self.name = name
  }

  @JS
  func describe() -> String {
    return "shape \(name)"
  }

  @JS
  static func kind() -> String {
    return "shape"
  }
}

@JSClass
private final class JSClassSquare: JSClassShape, @unchecked Sendable {
  private let side: Double

  @JS
  init(side: Double) {
    self.side = side
    super.init(name: "square")
  }

  @JS
  func area() -> Double {
    return side * side
  }
}

/// Has only static members and no `@JS init`, so JavaScript can't construct it.
@JSClass("JSMath")
private final class JSClassMath {
  @JS
  static func double(_ value: Double) -> Double {
    return value * 2
  }
}

@ExpoModule(classes: [JSClassPoint.self, JSClassShape.self, JSClassSquare.self, JSClassMath.self])
private final class MacroJSClassModule: Module {}

// MARK: - Tests

@Suite("Macro JavaScript class")
@JavaScriptActor
private struct MacroJSClassTests {
  let appContext: TestAppContext
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() {
    appContext = TestAppContext()
    appContext.moduleRegistry.register(module: MacroJSClassModule(appContext: appContext), name: nil)
  }

  @Test
  func `@JS init constructs the native instance that the members and arguments read`() throws {
    let distance = try runtime.eval(
      """
      a = new expo.modules.MacroJSClassModule.JSClassPoint(0, 0)
      b = new expo.modules.MacroJSClassModule.JSClassPoint(3, 4)
      a.distance(b)
      """)
    #expect(try distance.asDouble() == 5)
  }

  @Test
  func `the class of a root class extends no class`() throws {
    #expect(try runtime.eval(
      "Object.getPrototypeOf(expo.modules.MacroJSClassModule.JSClassPoint) === Function.prototype"
    ).asBool())
    #expect(try !runtime.eval(
      "new expo.modules.MacroJSClassModule.JSClassPoint(0, 0) instanceof expo.SharedObject"
    ).asBool())
  }

  @Test
  func `the class of a subclass extends the class of its superclass`() throws {
    try runtime.eval("square = new expo.modules.MacroJSClassModule.JSClassSquare(2)")

    #expect(try runtime.eval("square.area()").asDouble() == 4)
    #expect(try runtime.eval("square.describe()").asString() == "shape square")
    #expect(try runtime.eval("square instanceof expo.modules.MacroJSClassModule.JSClassShape").asBool())
    #expect(try runtime.eval(
      """
      Object.getPrototypeOf(expo.modules.MacroJSClassModule.JSClassSquare)
        === expo.modules.MacroJSClassModule.JSClassShape
      """
    ).asBool())
    #expect(try runtime.eval("expo.modules.MacroJSClassModule.JSClassSquare.kind()").asString() == "shape")
  }

  @Test
  func `binds a static member onto the class under the name of the macro argument`() throws {
    #expect(try runtime.eval("expo.modules.MacroJSClassModule.JSMath.double(2)").asDouble() == 4)
    #expect(try !runtime.eval("'JSClassMath' in expo.modules.MacroJSClassModule").asBool())
  }

  @Test
  func `constructing a class without a @JS init throws`() throws {
    let code = try runtime.eval(
      """
      try { new expo.modules.MacroJSClassModule.JSMath(); 'no error' } catch (error) { error.code }
      """)
    #expect(try code.asString() == "ERR_CONSTRUCTOR_UNAVAILABLE")
  }

  @Test
  func `an argument without a native instance throws`() throws {
    let code = try runtime.eval(
      """
      point = new expo.modules.MacroJSClassModule.JSClassPoint(0, 0)
      try { point.distance({}); 'no error' } catch (error) { error.code }
      """)
    #expect(try code.asString() == "ERR_NATIVE_INSTANCE_NOT_FOUND")
  }

  @Test
  func `an argument of another class throws`() throws {
    let code = try runtime.eval(
      """
      point = new expo.modules.MacroJSClassModule.JSClassPoint(0, 0)
      square = new expo.modules.MacroJSClassModule.JSClassSquare(1)
      try { point.distance(square); 'no error' } catch (error) { error.code }
      """)
    #expect(try code.asString() == "ERR_NATIVE_INSTANCE_TYPE_MISMATCH")
  }
}
