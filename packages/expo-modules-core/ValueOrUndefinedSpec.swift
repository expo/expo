// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import ExpoModulesCore

final class ValueOrUndefinedSpec: ExpoSpec {
  override class func spec() {
    describe("operators") {
      it("==") {
        expect(
          ValueOrUndefined<Int>.undefined == ValueOrUndefined<Int>.undefined
        ).to(beTrue())
        expect(
          ValueOrUndefined<Int>.value(unwrapped: 10) == ValueOrUndefined<Int>.value(unwrapped: 10)
        ).to(beTrue())
        expect(
          ValueOrUndefined<Int>.value(unwrapped: 10) == ValueOrUndefined<Int>.undefined
        ).to(beFalse())
        expect(
          ValueOrUndefined<Int>.undefined == ValueOrUndefined<Int>.value(unwrapped: 10)
        ).to(beFalse())
      }
      
      it("<") {
        expect(
          ValueOrUndefined<Int>.undefined < ValueOrUndefined<Int>.undefined
        ).to(beFalse())
        expect(
          ValueOrUndefined<Int>.value(unwrapped: 10) < ValueOrUndefined<Int>.value(unwrapped: 10)
        ).to(beFalse())
        expect(
          ValueOrUndefined<Int>.value(unwrapped: 10) < ValueOrUndefined<Int>.value(unwrapped: 20)
        ).to(beTrue())
        expect(
          ValueOrUndefined<Int>.value(unwrapped: 10) < ValueOrUndefined<Int>.undefined
        ).to(beFalse())
        expect(
          ValueOrUndefined<Int>.undefined == ValueOrUndefined<Int>.value(unwrapped: 10)
        ).to(beFalse())
      }
    }
    describe("module") {
      let appContext = AppContext.create()
      let runtime = try! appContext.runtime
      
      beforeSuite {
        appContext.moduleRegistry.register(moduleType: UndefinedSpecModule.self)
      }
      
      it("converts from undefined to ValueOrUndefinedSpec<Int>") {
        let wasUndefinded = try runtime
          .eval("expo.modules.ValueOrUndefinedModule.undefined_of_int(undefined)")
          .asBool()
        
        expect(wasUndefinded).to(beTrue())
      }
      
      it("converts from int to ValueOrUndefinedSpec<Int>") {
        let wasUndefinded = try runtime
          .eval("expo.modules.ValueOrUndefinedModule.undefined_of_int(10)")
          .asBool()
        
        expect(wasUndefinded).to(beFalse())
      }
      
      it("converts from undefined to ValueOrUndefinedSpec<Int?>") {
        let wasUndefinded = try runtime
          .eval("expo.modules.ValueOrUndefinedModule.undefined_of_optional_int(undefined, null)")
          .asBool()
        
        expect(wasUndefinded).to(beTrue())
      }
      
      it("converts from int to ValueOrUndefinedSpec<Int?>") {
        let wasUndefinded = try runtime
          .eval("expo.modules.ValueOrUndefinedModule.undefined_of_optional_int(10, 10)")
          .asBool()
        
        expect(wasUndefinded).to(beFalse())
      }
      
      it("converts from null to ValueOrUndefinedSpec<Int?>") {
        let wasUndefinded = try runtime
          .eval("expo.modules.ValueOrUndefinedModule.undefined_of_optional_int(null, null)")
          .asBool()
        
        expect(wasUndefinded).to(beFalse())
      }
      
      it("converts from array to [ValueOrUndefinedSpec<Int>]") {
        let wereUndefinded = try runtime
          .eval("expo.modules.ValueOrUndefinedModule.array_of_undefined_of_int([1, undefined, 2, undefined, 3])")
          .asArray().map { try $0!.asBool() }
        
        expect(wereUndefinded).to(equal([false, true, false, true, false]))
      }
      
      it("converts from array to [ValueOrUndefinedSpec<Int?>]") {
        let wereUndefinded = try runtime
          .eval("expo.modules.ValueOrUndefinedModule.array_of_undefined_of_optional_int([1, undefined, null, 2, undefined, null], [1, null, null, 2, null, null])")
          .asArray().map { try $0!.asBool() }
        
        expect(wereUndefinded).to(equal([false, true, false, false, true, false]))
      }
    }
  }
}

fileprivate final class UndefinedSpecModule: Module {
  func definition() -> ModuleDefinition {
    Name("ValueOrUndefinedModule")
    
    Function("undefined_of_int") { (value: ValueOrUndefined<Int>) in
      return value.isUndefinded
    }
    
    Function("undefined_of_optional_int") { (value: ValueOrUndefined<Int?>, expectedValue: Int?) in
      expect(value.optional).to(expectedValue == nil ? beNil() : equal(expectedValue))
      return value.isUndefinded
    }
    
    Function("array_of_undefined_of_int") { (values: [ValueOrUndefined<Int>]) in
      return values.map { $0.isUndefinded }
    }
    
    Function("array_of_undefined_of_optional_int") { (values: [ValueOrUndefined<Int?>], expectedValues: [Int?]) in
      expect(values.map{ $0.optional} ).to(equal(expectedValues))
      return values.map { $0.isUndefinded }
    }
  }
}
