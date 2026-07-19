// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("ValueOrUndefined")
struct ValueOrUndefinedTests {
  @Suite("operators")
  struct OperatorTests {
    @Test
    func `==`() {
      #expect(
        ValueOrUndefined<Int>.undefined == ValueOrUndefined<Int>.undefined
      )
      #expect(
        ValueOrUndefined<Int>.value(unwrapped: 10) == ValueOrUndefined<Int>.value(unwrapped: 10)
      )
      #expect(
        !(ValueOrUndefined<Int>.value(unwrapped: 10) == ValueOrUndefined<Int>.undefined)
      )
      #expect(
        !(ValueOrUndefined<Int>.undefined == ValueOrUndefined<Int>.value(unwrapped: 10))
      )
    }

    @Test
    func `<`() {
      #expect(
        !(ValueOrUndefined<Int>.undefined < ValueOrUndefined<Int>.undefined)
      )
      #expect(
        !(ValueOrUndefined<Int>.value(unwrapped: 10) < ValueOrUndefined<Int>.value(unwrapped: 10))
      )
      #expect(
        ValueOrUndefined<Int>.value(unwrapped: 10) < ValueOrUndefined<Int>.value(unwrapped: 20)
      )
      #expect(
        !(ValueOrUndefined<Int>.value(unwrapped: 10) < ValueOrUndefined<Int>.undefined)
      )
      #expect(
        !(ValueOrUndefined<Int>.undefined == ValueOrUndefined<Int>.value(unwrapped: 10))
      )
    }
  }

  @Suite("module", .serialized)
  @JavaScriptActor
  struct ModuleTests {
    let appContext: AppContext
    let runtime: ExpoRuntime

    init() throws {
      appContext = AppContext.create()
      runtime = try appContext.runtime
      appContext.moduleRegistry.register(moduleType: UndefinedSpecModule.self, name: nil)
    }

    @Test
    func `converts from undefined to ValueOrUndefinedSpec<Int>`() throws {
      let wasUndefined = try runtime
        .eval("expo.modules.ValueOrUndefinedModule.undefined_of_int(undefined)")
        .asBool()

      #expect(wasUndefined == true)
    }

    @Test
    func `converts from int to ValueOrUndefinedSpec<Int>`() throws {
      let wasUndefined = try runtime
        .eval("expo.modules.ValueOrUndefinedModule.undefined_of_int(10)")
        .asBool()

      #expect(wasUndefined == false)
    }

    @Test
    func `converts from undefined to ValueOrUndefinedSpec<Int?>`() throws {
      let wasUndefined = try runtime
        .eval("expo.modules.ValueOrUndefinedModule.undefined_of_optional_int(undefined, null)")
        .asBool()

      #expect(wasUndefined == true)
    }

    @Test
    func `converts from int to ValueOrUndefinedSpec<Int?>`() throws {
      let wasUndefined = try runtime
        .eval("expo.modules.ValueOrUndefinedModule.undefined_of_optional_int(10, 10)")
        .asBool()

      #expect(wasUndefined == false)
    }

    @Test
    func `converts from null to ValueOrUndefinedSpec<Int?>`() throws {
      let wasUndefined = try runtime
        .eval("expo.modules.ValueOrUndefinedModule.undefined_of_optional_int(null, null)")
        .asBool()

      #expect(wasUndefined == false)
    }

    @Test
    func `converts from array to [ValueOrUndefinedSpec<Int>]`() throws {
      let wereUndefined = try runtime
        .eval("expo.modules.ValueOrUndefinedModule.array_of_undefined_of_int([1, undefined, 2, undefined, 3])")
        .asArray().map { try $0.asBool() }

      #expect(wereUndefined == [false, true, false, true, false])
    }

    @Test
    func `converts from array to [ValueOrUndefinedSpec<Int?>]`() throws {
      let wereUndefined = try runtime
        .eval("expo.modules.ValueOrUndefinedModule.array_of_undefined_of_optional_int([1, undefined, null, 2, undefined, null], [1, null, null, 2, null, null])")
        .asArray().map { try $0.asBool() }

      #expect(wereUndefined == [false, true, false, false, true, false])
    }
  }
}

fileprivate final class UndefinedSpecModule: Module {
  func definition() -> ModuleDefinition {
    Name("ValueOrUndefinedModule")

    Function("undefined_of_int") { (value: ValueOrUndefined<Int>) in
      return value.isUndefined
    }

    Function("undefined_of_optional_int") { (value: ValueOrUndefined<Int?>, expectedValue: Int?) in
      #expect(value.optional == expectedValue)
      return value.isUndefined
    }

    Function("array_of_undefined_of_int") { (values: [ValueOrUndefined<Int>]) in
      return values.map { $0.isUndefined }
    }

    Function("array_of_undefined_of_optional_int") { (values: [ValueOrUndefined<Int?>], expectedValues: [Int?]) in
      #expect(values.map { $0.optional } == expectedValues)
      return values.map { $0.isUndefined }
    }
  }
}
