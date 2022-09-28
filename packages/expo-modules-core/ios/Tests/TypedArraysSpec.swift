// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import ExpoModulesCore

final class TypedArraysSpec: ExpoSpec {
  override func spec() {
    describe("module") {
      let appContext = AppContext.create()
      let runtime = appContext.runtime!

      beforeSuite {
        appContext.moduleRegistry.register(moduleType: TypedArraysModule.self)
      }

      // Gets the value at index 3 from the array
      it("reads from Int8Array") {
        let intValue = try runtime
          .eval([
            "typedArray = new Int8Array([2, 1, 3, 7])",
            "expo.modules.TypedArrays.int8_subscript_get(typedArray, 3)",
          ])
          .asInt()

        expect(intValue) == 7
      }

      // Sets the value at index 1 to the random int
      it("writes to Int8Array") {
        let randomInt = Int.random(in: -128...127)
        let array = try runtime
          .eval([
            "typedArray = new Int8Array(3)",
            "expo.modules.TypedArrays.int8_subscript_set(typedArray, 1, \(randomInt))",
            "Array.from(typedArray)",
          ])
          .asArray()

        expect(array[0]?.getInt()) == 0 // Remains unset
        expect(array[1]?.getInt()) == randomInt
        expect(array[2]?.getInt()) == 0 // Remains unset
      }

      // Gets a slice from the array from index 1 to 3
      it("reads from UInt16Array slice") {
        let values = try runtime
          .eval([
            "typedArray = new Uint16Array([0, 8, 4, 1])",
            "expo.modules.TypedArrays.uint16_subscript_range_get(typedArray, 1, 3)"
          ])
          .asArray()
          .map({ try $0?.asInt() })

        expect(values.count) == 3
        expect(values[0]) == 8
        expect(values[1]) == 4
        expect(values[2]) == 1
      }

      // Sets a slice of the array from index x to y
      it("writes to UInt16Array slice") {
        let random1 = Int.random(in: 0...65535)
        let random2 = Int.random(in: 0...65535)
        let values = try runtime
          .eval([
            "typedArray = new Uint16Array(4)",
            "expo.modules.TypedArrays.uint16_subscript_range_set(typedArray, 1, 2, [\(random1), \(random2)])",
            "Array.from(typedArray)",
          ])
          .asArray()

        expect(values[0]?.getInt()) == 0 // Remains unset
        expect(values[1]?.getInt()) == random1
        expect(values[2]?.getInt()) == random2
        expect(values[3]?.getInt()) == 0 // Remains unset
      }

      it("returns itself") {
        let input = try runtime.eval("typedArray = new Float32Array([1.2, 3.4]); typedArray").asTypedArray()
        let output = try runtime.eval("expo.modules.TypedArrays.return(typedArray)").asTypedArray()

        expect(input.getProperty("0").getDouble()) == output.getProperty("0").getDouble()
        expect(input.getProperty("1").getDouble()) == output.getProperty("1").getDouble()
        expect(input.getUnsafeMutableRawPointer()) == output.getUnsafeMutableRawPointer()
      }

      it("writes to unsafe raw pointer") {
        let count = 6
        let values = try runtime
          .eval([
            "typedArray = new Uint8Array(\(count))",
            "Array.from(expo.modules.TypedArrays.writeToUnsafeRawPointer(typedArray))",
          ])
          .asArray()
          .map({ $0?.getInt() ?? 0 })

        // Assume that at least one element should have changed
        expect(values.filter({ $0 != 0 }).count) >= 1
      }

      // TODO: Test throwing NotTypedArrayException and ArrayTypeMismatchException
    }
  }
}

fileprivate final class TypedArraysModule: Module {
  func definition() -> ModuleDefinition {
    Name("TypedArrays")

    Function("int8_subscript_get") { (array: Int8Array, index: Int) in
      return array[index]
    }

    Function("int8_subscript_set") { (array: Int8Array, index: Int, value: Int8) in
      array[index] = value
    }

    Function("uint16_subscript_range_get") { (array: Uint16Array, start: Int, end: Int) in
      return array[start...end]
    }

    Function("uint16_subscript_range_set") { (array: Uint16Array, start: Int, end: Int, values: [UInt16]) in
      array[start...end] = values
    }

    Function("return") { (array: TypedArray) -> JavaScriptTypedArray in
      return array.jsTypedArray
    }

    Function("writeToUnsafeRawPointer") { (array: TypedArray) -> JavaScriptTypedArray in
      let _ = SecRandomCopyBytes(kSecRandomDefault, array.byteLength, array.rawPointer)
      return array.jsTypedArray
    }
  }
}
