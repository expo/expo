// Copyright 2022-present 650 Industries. All rights reserved.
import Testing
import ExpoModulesTestCore

@testable import ExpoModulesCore

@Suite
struct FormatterTests {
  @Suite("E2E")
  struct E2E {
    let appContext: AppContext

    init() {
      self.appContext = AppContext.create()
      self.appContext.moduleRegistry.register(moduleType: FormatterTestModule.self, name: nil)
    }

    @Test("can be used in sync functions")
    func syncFunctions() throws {
      let r1 = try appContext.runtime
        .eval("expo.modules.FormatterModule.f1()")
        .asObject()

      let r2 = try appContext.runtime
        .eval("expo.modules.FormatterModule.f2()")
        .asObject()

      #expect(r1.getProperty("a").isUndefined() == true)
      #expect(r1.getProperty("b").getString() == "b")
      #expect(r1.getProperty("c").getString() == "c")

      #expect(r2.getProperty("a").getString() == "d")
      #expect(r2.getProperty("b").getString() == "default")
      #expect(r2.getProperty("c").isUndefined() == true)
    }

    @Test("can be used in async functions")
    func asyncFunctions() async throws {
      try appContext.runtime.eval(
        "expo.modules.FormatterModule.f1Async().then((result) => { globalThis.result = result; })"
      )
      try await expectEventually {
        try appContext.runtime.eval("!!globalThis.result").asBool() == true
      }
      let r1 = try appContext.runtime.eval("globalThis.result").asObject()

      try appContext.runtime.eval("globalThis.result = null")

      try appContext.runtime.eval(
        "expo.modules.FormatterModule.f2Async().then((result) => { globalThis.result = result; })"
      )
      try await expectEventually {
        try appContext.runtime.eval("!!globalThis.result").asBool() == true
      }
      let r2 = try appContext.runtime.eval("globalThis.result").asObject()

      #expect(r1.getProperty("a").isUndefined() == true)
      #expect(r1.getProperty("b").getString() == "b")
      #expect(r1.getProperty("c").getString() == "c")

      #expect(r2.getProperty("a").getString() == "d")
      #expect(r2.getProperty("b").getString() == "default")
      #expect(r2.getProperty("c").isUndefined() == true)
    }
  }
}

fileprivate struct MyRecord: Record {
  @Field
  var a: String = "a"

  @Field
  var b: String? = "b"

  @Field
  var c: String = "c"
}

fileprivate final class FormatterTestModule: Module {
  func definition() -> ModuleDefinition {
    Name("FormatterModule")

    Function("f1") {
      return MyRecord().format { formatter in
        formatter.property("a", keyPath: \.a).skip()
      }
    }

    Function("f2") {
      return MyRecord(b: nil).format { formatter in
        formatter.property("a", keyPath: \.a).map { $0.replacingOccurrences(of: "a", with: "d") }
        formatter.property("b", keyPath: \.b).map { $0 ?? "default" }
        formatter.property("c", keyPath: \.c).skip()
      }
    }

    AsyncFunction("f1Async") {
      return MyRecord().format { formatter in
        formatter.property("a", keyPath: \.a).skip()
      }
    }

    AsyncFunction("f2Async") {
      return MyRecord(b: nil).format { formatter in
        formatter.property("a", keyPath: \.a).map { $0.replacingOccurrences(of: "a", with: "d") }
        formatter.property("b", keyPath: \.b).map { $0 ?? "default" }
        formatter.property("c", keyPath: \.c).skip()
      }
    }
  }
}
