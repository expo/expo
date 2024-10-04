import ABI46_0_0ExpoModulesTestCore

@testable import ABI46_0_0ExpoModulesCore

class FunctionSpec: ExpoSpec {
  override func spec() {
    let appContext = AppContext.create()
    let functionName = "test function name"

    context("native") {
      func testFunctionReturning<T: Equatable>(value returnValue: T) {
        waitUntil { done in
          mockModuleHolder(appContext) {
            AsyncFunction(functionName) {
              return returnValue
            }
          }
          .call(function: functionName, args: []) { result in
            let value = try! result.get()

            expect(value).notTo(beNil())
            expect(value).to(beAKindOf(T.self))
            expect(value as? T).to(equal(returnValue))
            done()
          }
        }
      }

      it("is called") {
        waitUntil { done in
          mockModuleHolder(appContext) {
            AsyncFunction(functionName) {
              done()
            }
          }
          .call(function: functionName, args: [])
        }
      }

      it("returns bool values") {
        testFunctionReturning(value: true)
        testFunctionReturning(value: false)
        testFunctionReturning(value: [true, false])
      }

      it("returns int values") {
        testFunctionReturning(value: 1_234)
        testFunctionReturning(value: [2, 1, 3, 7])
      }

      it("returns double values") {
        testFunctionReturning(value: 3.14)
        testFunctionReturning(value: [0, 1.1, 2.2])
      }

      it("returns string values") {
        testFunctionReturning(value: "a string")
        testFunctionReturning(value: ["expo", "modules", "core"])
      }

      it("is called with nil value") {
        let str: String? = nil

        mockModuleHolder(appContext) {
          AsyncFunction(functionName) { (a: String?) in
            expect(a == nil) == true
          }
        }
        .callSync(function: functionName, args: [str as Any])
      }

      it("is called with an array of arrays") {
        let array: [[String]] = [["expo"]]

        mockModuleHolder(appContext) {
          AsyncFunction(functionName) { (a: [[String]]) in
            expect(a.first!.first) == array.first!.first
          }
        }
        .callSync(function: functionName, args: [array])
      }

      describe("converting dicts to records") {
        struct TestRecord: Record {
          @Field var property: String = "expo"
          @Field var optionalProperty: Int?
          @Field("propertyWithCustomKey") var customKeyProperty: String = "expo"
        }
        let dict = [
          "property": "Hello",
          "propertyWithCustomKey": "Expo!"
        ]

        it("converts to simple record when passed as an argument") {
          waitUntil { done in
            mockModuleHolder(appContext) {
              AsyncFunction(functionName) { (a: TestRecord) in
                return a.property
              }
            }
            .call(function: functionName, args: [dict]) { result in
              let value = try! result.get()

              expect(value).notTo(beNil())
              expect(value).to(beAKindOf(String.self))
              expect(value).to(be(dict["property"]))
              done()
            }
          }
        }

        it("converts to record with custom key") {
          waitUntil { done in
            mockModuleHolder(appContext) {
              AsyncFunction(functionName) { (a: TestRecord) in
                return a.customKeyProperty
              }
            }
            .call(function: functionName, args: [dict]) { result in
              let value = try! result.get()
              expect(value).notTo(beNil())
              expect(value).to(beAKindOf(String.self))
              expect(value).to(be(dict["propertyWithCustomKey"]))
              done()
            }
          }
        }

        it("returns the record back") {
          waitUntil { done in
            mockModuleHolder(appContext) {
              AsyncFunction(functionName) { (a: TestRecord) in
                return a.toDictionary()
              }
            }
            .call(function: functionName, args: [dict]) { result in
              let value = try! result.get()

              expect(value).notTo(beNil())
              expect(value).to(beAKindOf(Record.Dict.self))

              let valueAsDict = value as! Record.Dict

              expect(valueAsDict["property"] as? String).to(equal(dict["property"]))
              expect(valueAsDict["propertyWithCustomKey"] as? String).to(equal(dict["propertyWithCustomKey"]))
              done()
            }
          }
        }
      }

      it("throws when called with more arguments than expected") {
        waitUntil { done in
          mockModuleHolder(appContext) {
            AsyncFunction(functionName) { (_: Int) in
              return "something"
            }
          }
          // Function expects one argument, let's give it more.
          .call(function: functionName, args: [1, 2]) { result in
            switch result {
            case .failure(let error):
              expect(error).notTo(beNil())
              expect(error).to(beAKindOf(InvalidArgsNumberException.self))
            case .success(_):
              fail()
            }
            done()
          }
        }
      }

      it("throws when called with arguments of incompatible types") {
        waitUntil { done in
          mockModuleHolder(appContext) {
            AsyncFunction(functionName) { (_: String) in
              return "something"
            }
          }
          // Function expects a string, let's give it a number.
          .call(function: functionName, args: [1]) { result in
            switch result {
            case .failure(let error):
              expect(error).notTo(beNil())
              expect(error).to(beAKindOf(ArgumentCastException.self))
              expect(error.isCausedBy(Conversions.CastingException<String>.self)) == true
            case .success(_):
              fail()
            }
            done()
          }
        }
      }
    }
    
    context("JavaScript") {
      let runtime = appContext.runtime
      
      beforeSuite {
        appContext.moduleRegistry.register(holder: mockModuleHolder(appContext) {
          Name("TestModule")

          Function("returnPi") { Double.pi }
          
          Function("returnNull") { () -> Double? in
            return nil
          }
          
          Function("isArgNull") { (arg: Double?) -> Bool in
            return arg == nil
          }
        })
      }
      
      it("returns values") {
        expect(try runtime?.eval("ExpoModules.TestModule.returnPi()").asDouble()) == Double.pi
        expect(try runtime?.eval("ExpoModules.TestModule.returnNull()").isNull()) == true
      }
      
      it("accepts optional arguments") {
        expect(try runtime?.eval("ExpoModules.TestModule.isArgNull(3.14)").asBool()) == false
        expect(try runtime?.eval("ExpoModules.TestModule.isArgNull(null)").asBool()) == true
      }
    }
  }
}
