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
    
    it("has native ref type") {
      let result = try runtime.eval("expo.modules.FirstModule.createSharedString().nativeRefType")
      
      expect(result.kind) == .string
      expect(try result.asString()) == "string"
    }
  }
}

private let sharedDataString = "I can be shared among independent modules"

private class SharedString: SharedRef<String> {
  override var nativeRefType: String {
    get {
      "string"
    }
  }
}

private class FirstModule: Module {
  public func definition() -> ModuleDefinition {
    Function("createSharedData") { (string: String) -> SharedRef<Data> in
      let data = Data(string.utf8)
      return SharedRef<Data>(data)
    }
    
    Function("createSharedString") {
      SharedString("string")
    }
  }
}

private class SecondModule: Module {
  public func definition() -> ModuleDefinition {
    Function("stringFromSharedData") { (data: SharedRef<Data>) -> String in
      return String(decoding: data.ref, as: UTF8.self)
    }
  }
}
