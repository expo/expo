import ExpoModulesTestCore

@testable import ExpoModulesCore

class PropertyComponentSpec: ExpoSpec {
  override func spec() {
    describe("property") {
      it("gets the value") {
        let property = Property("test") { return "expo" }
        expect(property.getValue()) == "expo"
      }

      it("sets the value") {
        var value = Int.random(in: 0..<100)
        let property = Property("test")
          .get { value }
          .set { (newValue: Int) in
            value = newValue
          }

        let newValue = Int.random(in: 0..<100)
        property.setValue(newValue)

        expect(property.getValue()) == value
        expect(value) == newValue
      }
    }

    describe("module property") {
      let appContext = AppContext.create()
      let runtime = appContext.runtime

      beforeSuite {
        class PropertyTestModule: Module {
          func definition() -> ModuleDefinition {
            Name("PropertyTest")

            Property("readOnly") {
              return "foo"
            }

            var writablePropertyValue = 444
            Property("writable")
              .get {
                return writablePropertyValue
              }
              .set { value in
                writablePropertyValue = value
              }

            Property("withCaller") { (caller: JavaScriptObject) -> String in
              // Here, the caller is a JS object of the module.
              // Return another property of itself.
              return caller.getProperty("readOnly").getString()
            }

            Property("undefined")
          }
        }
        appContext.moduleRegistry.register(moduleType: PropertyTestModule.self)
      }

      it("gets read-only property") {
        let value = try runtime?.eval("expo.modules.PropertyTest.readOnly")
        expect(value?.getString()) == "foo"
      }

      it("gets writable property") {
        let value = try runtime?.eval("expo.modules.PropertyTest.writable")
        expect(value?.getInt()) == 444
      }

      it("sets writable property") {
        try runtime?.eval("expo.modules.PropertyTest.writable = 777")
        let value = try runtime?.eval("expo.modules.PropertyTest.writable")
        expect(value?.getInt()) == 777
      }

      it("is enumerable") {
        let keys = try runtime?.eval("Object.keys(expo.modules.PropertyTest)").getArray().map { $0.getString() } ?? []
        expect(keys).to(contain("readOnly", "writable", "withCaller", "undefined"))
      }

      it("is called with the caller") {
        let value = try runtime?.eval("expo.modules.PropertyTest.withCaller")
        expect(value?.getString()) == "foo"
      }

      it("returns undefined when getter is not specified") {
        let value = try runtime?.eval("expo.modules.PropertyTest.undefined")
        expect(value?.isUndefined()) == true
      }
    }
  }
}
