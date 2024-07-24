import ExpoModulesTestCore

@testable import ExpoModulesCore

final class SharedRefSpec: ExpoSpec {
  override class func spec() {
    let appContext = AppContext.create()
    let runtime = try! appContext.runtime

    beforeSuite {
      appContext.moduleRegistry.register(moduleType: FirstModule.self)
      appContext.moduleRegistry.register(moduleType: SecondModule.self)
    }

    it("is a shared object") {
      expect(SharedRef<UIImage>.self is SharedObject.Type)
    }

    it("has dynamic type for shared objects") {
      let dynamicType = ~SharedRef<UIImage>.self

      expect(dynamicType is DynamicSharedObjectType) == true
    }

    it("creates shared data") {
      let result = try runtime.eval("expo.modules.FirstModule.createSharedData('\(sharedDataString)')")

      expect(result.kind) == .object
    }

    it("shares Data object") {
      let result = try runtime.eval([
        "sharedData = expo.modules.FirstModule.createSharedData('\(sharedDataString)')",
        "expo.modules.SecondModule.stringFromSharedData(sharedData)"
      ])

      expect(result.kind) == .string
      expect(try result.asString()) == sharedDataString
    }
  }
}

private let sharedDataString = "I can be shared among independent modules"

private class FirstModule: Module {
  public func definition() -> ModuleDefinition {
    Function("createSharedData") { (string: String) -> SharedRef<Data> in
      let data = Data(string.utf8)
      return SharedRef<Data>(data)
    }
  }
}

private class SecondModule: Module {
  public func definition() -> ModuleDefinition {
    Function("stringFromSharedData") { (data: SharedRef<Data>) -> String in
      return String(decoding: data.pointer, as: UTF8.self)
    }
  }
}
