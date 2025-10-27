import ExpoModulesTestCore

@testable import ExpoModulesCore

class RecordSpec: ExpoSpec {
  override class func spec() {
    let appContext = AppContext.create()

    it("initializes with empty dictionary") {
      struct TestRecord: Record { }
      _ = try TestRecord(from: [:], appContext: appContext)
    }

    it("works back and forth with a field") {
      struct TestRecord: Record {
        @Field var a: String?
      }
      let dict = ["a": "b"]
      let record = try TestRecord(from: dict, appContext: appContext)

      expect(record.a).to(equal(dict["a"]))
      expect(record.toDictionary()["a"] as? String).to(equal(dict["a"]!))
    }

    it("works back and forth with an enum") {
      enum StringEnum: String, Enumerable {
        case deleted
        case created
      }
      enum IntEnum: Int, Enumerable {
        case one = 1
        case two
      }
      struct TestRecord: Record {
        @Field var a: StringEnum = .created
        @Field var b: IntEnum?
      }
      let dict = ["a": "deleted", "b": 1]
      let record = try TestRecord(from: dict, appContext: appContext)

      expect(record.a).to(equal(StringEnum.deleted))
      expect(record.b).to(equal(IntEnum.one))

      expect(record.toDictionary()["a"] as? String).to(equal(dict["a"]! as! String))
      expect(record.toDictionary()["b"] as? Int).to(equal(dict["b"]! as! Int))
    }

    it("works back and forth with Either") {
      struct TestRecord: Record {
        @Field var stringValue: Either<Bool, String>?
        @Field var boolValue: Either<Bool, String>?
        @Field var intValue: Either<Int, String>?
        @Field var nilValue: Either<Int, String>?
      }
      let dict: [String: Any] = [
        "stringValue": "custom",
        "boolValue": true,
        "intValue": 42,
      ]
      let record = try TestRecord(from: dict, appContext: appContext)
      expect(record.stringValue?.get() as String?).to(equal("custom"))
      expect(record.boolValue?.get() as Bool?).to(equal(true))
      expect(record.intValue?.get() as Int?).to(equal(42))
      expect(record.nilValue).to(beNil())

      let asDict = record.toDictionary(appContext: appContext)
      expect(asDict["stringValue"] as? String).to(equal("custom"))
      expect(asDict["boolValue"] as? Bool).to(equal(true))
      expect(asDict["intValue"] as? Int).to(equal(42))
      expect(asDict["nilValue"] as? Int).to(beNil())
    }

    it("works back and forth with a keyed field") {
      struct TestRecord: Record {
        @Field("key") var a: String?
      }
      let dict = ["key": "b"]
      let record = try TestRecord(from: dict, appContext: appContext)

      expect(record.a).to(equal(dict["key"]))
      expect(record.toDictionary()["key"] as? String).to(equal(dict["key"]!))
    }

    it("throws when required field is missing") {
      struct TestRecord: Record {
        @Field(.required) var a: Int
      }

      expect { try TestRecord(from: [:], appContext: appContext) }.to(throwError { error in
        expect(error).to(beAKindOf(FieldRequiredException.self))
      })
    }

    it("throws when casting is not possible") {
      struct TestRecord: Record {
        @Field var a: Int
      }
      let dict = ["a": "try with String instead of Int"]

      expect { try TestRecord(from: dict, appContext: appContext) }.to(throwError { error in
        expect(error).to(beAKindOf(FieldInvalidTypeException.self))
      })
    }
  }
}
