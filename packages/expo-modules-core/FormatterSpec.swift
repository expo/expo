// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import ExpoModulesCore

final class FormatterSpec: ExpoSpec {
  override class func spec() {
    describe("e2e") {
      let appContext = AppContext.create()
      let runtime = try! appContext.runtime

      beforeSuite {
        appContext.moduleRegistry.register(moduleType: FormatterSpecModule.self, name: nil)
      }

      it("sync function") {
        let r1 = try runtime
          .eval("expo.modules.FormatterModule.f1()")
          .asObject()

        let r2 = try runtime
          .eval("expo.modules.FormatterModule.f2()")
          .asObject()

        expect(r1.getProperty("a").isUndefined()).to(beTrue())
        expect(r1.getProperty("b").getString()).to(equal("b"))
        expect(r1.getProperty("c").getString()).to(equal("c"))

        expect(r2.getProperty("a").getString()).to(equal("d"))
        expect(r2.getProperty("b").getString()).to(equal("default"))
        expect(r2.getProperty("c").isUndefined()).to(beTrue())
      }

      it("asyn function") {
        try runtime.eval(
          "expo.modules.FormatterModule.f1Async().then((result) => { globalThis.result = result; })"
        )
        expect(safeBoolEval("!!globalThis.result")).toEventually(beTrue(), timeout: .milliseconds(5000))
        let r1 = try runtime.eval("globalThis.result").asObject()

        try runtime.eval("globalThis.result = null")

        try runtime.eval(
          "expo.modules.FormatterModule.f2Async().then((result) => { globalThis.result = result; })"
        )
        expect(safeBoolEval("!!globalThis.result")).toEventually(beTrue(), timeout: .milliseconds(5000))
        let r2 = try runtime.eval("globalThis.result").asObject()

        expect(r1.getProperty("a").isUndefined()).to(beTrue())
        expect(r1.getProperty("b").getString()).to(equal("b"))
        expect(r1.getProperty("c").getString()).to(equal("c"))

        expect(r2.getProperty("a").getString()).to(equal("d"))
        expect(r2.getProperty("b").getString()).to(equal("default"))
        expect(r2.getProperty("c").isUndefined()).to(beTrue())
      }

      func safeBoolEval(_ js: String) -> Bool {
        var result = false
        do {
          try EXUtilities.catchException {
            guard let jsResult = try? runtime.eval(js) else {
              return
            }
            result = jsResult.getBool()
          }
        } catch {
          return false
        }
        return result
      }
    }
  }
}

fileprivate struct MyRecord : Record {
  @Field
  var a: String  = "a"

  @Field
  var b: String? = "b"

  @Field
  var c: String = "c"
}

fileprivate final class FormatterSpecModule: Module {
  func definition() -> ModuleDefinition {
    Name("FormatterModule")

    Function("f1") {
      let formatter = ExpoModulesCore.Formatter<MyRecord>()
      formatter.property("a", keyPath: \.a).skip()

      return format(record: MyRecord(), formatter: formatter)
    }

    Function("f2") {
      let formatter = ExpoModulesCore.Formatter<MyRecord>()
      formatter.property("a", keyPath: \.a).map { $0.replacingOccurrences(of: "a", with: "d") }
      formatter.property("b", keyPath: \.b).map { $0 ?? "default" }
      formatter.property("c", keyPath: \.c).skip()

      return format(record: MyRecord(b: nil), formatter: formatter)
    }

    AsyncFunction("f1Async") {
      let formatter = ExpoModulesCore.Formatter<MyRecord>()
      formatter.property("a", keyPath: \.a).skip()

      return format(record: MyRecord(), formatter: formatter)
    }

    AsyncFunction("f2Async") {
      let formatter = ExpoModulesCore.Formatter<MyRecord>()
      formatter.property("a", keyPath: \.a).map { $0.replacingOccurrences(of: "a", with: "d") }
      formatter.property("b", keyPath: \.b).map { $0 ?? "default" }
      formatter.property("c", keyPath: \.c).skip()

      return format(record: MyRecord(b: nil), formatter: formatter)
    }
  }
}
