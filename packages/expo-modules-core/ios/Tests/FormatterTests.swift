// Copyright 2022-present 650 Industries. All rights reserved.
import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

@Suite
@JavaScriptActor
struct FormatterTests {
  @Suite("E2E")
  @JavaScriptActor
  struct E2E {
    let appContext: AppContext

    init() {
      self.appContext = TestAppContext()
      self.appContext.moduleRegistry.register(moduleType: FormatterTestModule.self, name: nil)
    }

    @Test
    func `can be used in sync functions`() throws {
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

    @Test
    func `can be used in async functions`() async throws {
      let runtime = try appContext.runtime
      let r1 = try await runtime.evalAsync("expo.modules.FormatterModule.f1Async()").ref()
      let r2 = try await runtime.evalAsync("expo.modules.FormatterModule.f2Async()").ref()
      // `evalAsync` resumes off the JavaScript thread, so the result is read on it.
      let (isR1AUndefined, r1B, r1C) = try await runtime.execute {
        let r1 = try r1.take().asObject()
        return (r1.getProperty("a").isUndefined(), r1.getProperty("b").getString(), r1.getProperty("c").getString())
      }
      let (r2A, r2B, isR2CUndefined) = try await runtime.execute {
        let r2 = try r2.take().asObject()
        return (r2.getProperty("a").getString(), r2.getProperty("b").getString(), r2.getProperty("c").isUndefined())
      }

      #expect(isR1AUndefined == true)
      #expect(r1B == "b")
      #expect(r1C == "c")

      #expect(r2A == "d")
      #expect(r2B == "default")
      #expect(isR2CUndefined == true)
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
