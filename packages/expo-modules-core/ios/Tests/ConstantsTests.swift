// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("Constants")
struct ConstantsTests {
  let appContext = AppContext()

  @Test
  func `takes closure resolving to dictionary`() {
    let holder = mockModuleHolder(appContext) {
      Constants {
        return ["test": 123]
      }
    }
    #expect(holder.getLegacyConstants()["test"] as? Int == 123)
  }

  @Test
  func `takes the dictionary`() {
    let holder = mockModuleHolder(appContext) {
      Constants(["test": 123])
    }
    #expect(holder.getLegacyConstants()["test"] as? Int == 123)
  }

  @Test
  func `merges multiple constants definitions`() {
    let holder = mockModuleHolder(appContext) {
      Constants(["test": 456, "test2": 789])
      Constants(["test": 123])
    }
    let consts = holder.getLegacyConstants()
    #expect(consts["test"] as? Int == 123)
    #expect(consts["test2"] as? Int == 789)
  }

  @Test
  func `constants provider values are not double-wrapped optionals`() {
    let constants = ConstantsProvider.shared.constants()
    for (key, value) in constants {
      let mirror = Mirror(reflecting: value)
      #expect(mirror.displayStyle != .optional, "Value for key '\(key)' is a wrapped Optional — will bridge as null to JS")
    }
  }

  @Test
  func `nested constants provider values are not double-wrapped optionals`() {
    let constants = ConstantsProvider.shared.constants()
    if let platform = constants["platform"] as? [String: Any],
      let ios = platform["ios"] as? [String: Any] {
      for (key, value) in ios {
        let mirror = Mirror(reflecting: value)
        #expect(mirror.displayStyle != .optional, "Value for key 'platform.ios.\(key)' is a wrapped Optional — will bridge as null to JS")
      }
    }
  }

  struct TestRecord: Record {
    @Field var name: String = "expo"
    @Field var version: Int = 55
  }

  enum TestEnum: String, Enumerable {
    case active
    case inactive
  }

  @Suite
  @JavaScriptActor
  struct JavaScriptTests {
    let appContext: AppContext
    var runtime: ExpoRuntime {
      get throws {
        try appContext.runtime
      }
    }

    init() {
      appContext = AppContext.create()

      let optionalString: String? = "optional value"
      let optionalInt: Int? = 42

      appContext.moduleRegistry.register(holder: mockModuleHolder(appContext) {
        Name("ConstantsModule")

        Constants([
          "stringValue": "hello",
          "intValue": 123,
          "doubleValue": 3.14,
          "boolValue": true,
          "nullValue": nil,
          "nestedDict": ["key": "value", "number": 99] as [String: Any],
          "arrayValue": [1, 2, 3],
          "optionalString": optionalString,
          "optionalInt": optionalInt,
          "record": TestRecord(),
          "enum": TestEnum.active,
          "data": Data([0x48, 0x65, 0x6C, 0x6C, 0x6F]),
          "arrayBuffer": try! NativeArrayBuffer.copy(data: Data([1, 2, 3, 4])),
          "size": CGSize(width: 100, height: 200),
          "colors": [
            UIColor(red: 1, green: 0, blue: 0, alpha: 1),
            UIColor(red: 0, green: 0.5, blue: 1, alpha: 0.8),
          ],
          "void": (),
          "eitherString": Either<Bool, String>("hello"),
          "eitherBool": Either<Bool, String>(true),
        ])
      })
    }

    @Test
    func `exposes primitive constants to JS`() throws {
      let module = try runtime.eval("expo.modules.ConstantsModule")
      let obj = module.getObject()

      #expect(try obj.getProperty("stringValue").asString() == "hello")
      #expect(try obj.getProperty("intValue").asInt() == 123)
      #expect(try obj.getProperty("doubleValue").asDouble() == 3.14)
      #expect(try obj.getProperty("boolValue").asBool() == true)
    }

    @Test
    func `exposes null constant to JS`() throws {
      let value = try runtime.eval("expo.modules.ConstantsModule.nullValue")
      #expect(value.isNull() == true)
    }

    @Test
    func `exposes nested dictionary to JS`() throws {
      let nested = try runtime.eval("expo.modules.ConstantsModule.nestedDict")
      #expect(nested.isObject() == true)
      #expect(try nested.getObject().getProperty("key").asString() == "value")
      #expect(try nested.getObject().getProperty("number").asInt() == 99)
    }

    @Test
    func `exposes array constant to JS`() throws {
      let array = try runtime.eval("expo.modules.ConstantsModule.arrayValue")
      #expect(array.isObject() == true)
      #expect(try runtime.eval("expo.modules.ConstantsModule.arrayValue.length").asInt() == 3)
      #expect(try runtime.eval("expo.modules.ConstantsModule.arrayValue[0]").asInt() == 1)
      #expect(try runtime.eval("expo.modules.ConstantsModule.arrayValue[2]").asInt() == 3)
    }

    @Test
    func `exposes optional-wrapped values to JS`() throws {
      let module = try runtime.eval("expo.modules.ConstantsModule")
      let obj = module.getObject()

      #expect(try obj.getProperty("optionalString").asString() == "optional value")
      #expect(try obj.getProperty("optionalInt").asInt() == 42)
    }

    @Test
    func `exposes record constant to JS`() throws {
      let record = try runtime.eval("expo.modules.ConstantsModule.record")
      #expect(record.isObject() == true)
      #expect(try record.getObject().getProperty("name").asString() == "expo")
      #expect(try record.getObject().getProperty("version").asInt() == 55)
    }

    @Test
    func `exposes enum constant to JS`() throws {
      let value = try runtime.eval("expo.modules.ConstantsModule.enum")
      #expect(try value.asString() == "active")
    }

    @Test
    func `exposes array buffer constant`() throws {
      #expect(try runtime.eval("expo.modules.ConstantsModule.arrayBuffer instanceof ArrayBuffer").asBool() == true)
      #expect(try runtime.eval("expo.modules.ConstantsModule.arrayBuffer.byteLength").asInt() == 4)
      #expect(try runtime.eval("new Uint8Array(expo.modules.ConstantsModule.arrayBuffer)[0]").asInt() == 1)
      #expect(try runtime.eval("new Uint8Array(expo.modules.ConstantsModule.arrayBuffer)[3]").asInt() == 4)
    }

    @Test
    func `exposes data constant as Uint8Array`() throws {
      #expect(try runtime.eval("expo.modules.ConstantsModule.data instanceof Uint8Array").asBool() == true)
      #expect(try runtime.eval("expo.modules.ConstantsModule.data.length").asInt() == 5)
      #expect(try runtime.eval("expo.modules.ConstantsModule.data[0]").asInt() == 0x48)
      #expect(try runtime.eval("expo.modules.ConstantsModule.data[4]").asInt() == 0x6F)
    }

    @Test
    func `exposes array of convertibles to JS`() throws {
      #expect(try runtime.eval("expo.modules.ConstantsModule.colors.length").asInt() == 2)
      #expect(try runtime.eval("expo.modules.ConstantsModule.colors[0]").asString() == "#ff0000ff")
      #expect(try runtime.eval("expo.modules.ConstantsModule.colors[1]").asString() == "#0080ffcc")
    }

    @Test
    func `exposes void constant as undefined`() throws {
      #expect(try runtime.eval("'void' in expo.modules.ConstantsModule").asBool() == true)
      #expect(try runtime.eval("expo.modules.ConstantsModule.void").isUndefined() == true)
    }

    @Test
    func `exposes either constants to JS`() throws {
      #expect(try runtime.eval("expo.modules.ConstantsModule.eitherString").asString() == "hello")
      #expect(try runtime.eval("expo.modules.ConstantsModule.eitherBool").asBool() == true)
    }

    @Test
    func `exposes convertible constant to JS`() throws {
      let size = try runtime.eval("expo.modules.ConstantsModule.size")
      #expect(size.isObject() == true)
      #expect(try size.getObject().getProperty("width").asDouble() == 100)
      #expect(try size.getObject().getProperty("height").asDouble() == 200)
    }
  }
}
