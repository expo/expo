import ExpoModulesTestCore

@testable import ExpoModulesCore

class RecordSpec: ExpoSpec {
  override func spec() {
    it("initializes with empty dictionary") {
      struct TestRecord: Record { }
      _ = try TestRecord(from: [:])
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

      expect { try TestRecord(from: [:]) }.to(throwError { error in
        expect(error).to(beAKindOf(FieldRequiredException.self))
      })
    }

    it("throws when casting is not possible") {
      struct TestRecord: Record {
        @Field var a: Int
      }
      let dict = ["a": "try with String instead of Int"]

      expect { try TestRecord(from: dict) }.to(throwError { error in
        expect(error).to(beAKindOf(FieldInvalidTypeException.self))
      })
    }
  }
}
