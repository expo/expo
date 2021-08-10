import Quick
import Nimble

@testable import ExpoModulesCore

class RecordSpec: QuickSpec {
  override func spec() {
    it("initializes with empty dictionary") {
      struct TestRecord: Record { }
      let _ = try TestRecord(from: [:])
    }

    it("works back and forth with a field") {
      struct TestRecord: Record {
        @Field var a: String?
      }
      let dict = ["a": "b"]
      let record = try TestRecord(from: dict)

      expect(record.a).to(be(dict["a"]))
      expect(record.toDictionary()["a"]).to(be(dict["a"]))
    }

    it("works back and forth with a keyed field") {
      struct TestRecord: Record {
        @Field("key") var a: String?
      }
      let dict = ["key": "b"]
      let record = try TestRecord(from: dict)

      expect(record.a).to(be(dict["key"]))
      expect(record.toDictionary()["key"]).to(be(dict["key"]))
    }

    it("throws when required field is missing") {
      struct TestRecord: Record {
        @Field(.required) var a: Int
      }

      do {
        let _ = try TestRecord(from: [:])
        fail()
      } catch let error as CodedError {
        expect(error).to(beAKindOf(FieldRequiredError.self))
        expect(error.code).to(equal("ERR_FIELD_REQUIRED"))
        expect(error.description).to(equal(FieldRequiredError(fieldKey: "a").description))
      }
    }

    it("throws when casting is not possible") {
      struct TestRecord: Record {
        @Field var a: Int
      }
      let dict = ["a": "try with String instead of Int"]

      do {
        let _ = try TestRecord(from: dict)
        fail()
      } catch let error as CodedError {
        expect(error).to(beAKindOf(FieldInvalidTypeError.self))
        expect(error.code).to(equal("ERR_FIELD_INVALID_TYPE"))
        expect(error.description).to(equal(FieldInvalidTypeError(fieldKey: "a", value: dict["a"], desiredType: Int.self).description))
      }
    }
  }
}
