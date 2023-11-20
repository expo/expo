// Copyright 2022-present 650 Industries. All rights reserved.

import CoreGraphics
import ExpoModulesTestCore

@testable import ExpoModulesCore

final class DynamicTypeSpec: ExpoSpec {
  override class func spec() {
    let appContext = AppContext.create()

    // MARK: - DynamicRawType

    describe("DynamicRawType") {
      it("is created") {
        expect(~String.self).to(beAKindOf(DynamicRawType<String>.self))
        expect(~Bool.self).to(beAKindOf(DynamicRawType<Bool>.self))
        expect(~ExpoSpec.self).to(beAKindOf(DynamicRawType<ExpoSpec>.self))
      }
      describe("casts") {
        it("succeeds") {
          expect(try (~String.self).cast("expo", appContext: appContext) as? String) == "expo"
          expect(try (~Double.self).cast(2.1, appContext: appContext) as? Double) == 2.1
          expect(try (~Bool.self).cast(false, appContext: appContext) as? Bool) == false
        }
        it("throws NullCastException") {
          let value: Double? = nil
          let anyValue = value as Any

          expect { try (~Double.self).cast(anyValue, appContext: appContext) }.to(
            throwError(errorType: Conversions.NullCastException<Double>.self)
          )
        }
        it("throws CastingException") {
          expect { try (~String.self).cast(true, appContext: appContext) }.to(
            throwError(errorType: Conversions.CastingException<String>.self)
          )
        }
      }
      describe("wraps") {
        it("is true") {
          expect(~Double.self ~> Double.self) == true
          expect(~Bool.self ~> Bool.self) == true
          expect(~DynamicTypeSpec.self ~> DynamicTypeSpec.self) == true
        }
        it("is false") {
          expect(~Double.self !~> Bool.self) == true
          expect(~Bool.self !~> Double.self) == true
          expect(~DynamicTypeSpec.self !~> ExpoSpec.self) == true
        }
      }
      describe("equals") {
        it("is true") {
          expect(~Int.self == ~Int.self) == true
          expect(~Double.self == ~Double.self) == true
          expect(~Bool.self == ~Bool.self) == true
          expect(~ExpoSpec.self == ~ExpoSpec.self) == true
        }
        it("is false") {
          expect(~Int.self != ~String.self) == true
          expect(~String.self != ~CGSize.self) == true
          expect(~Bool.self != ~Promise.self) == true
        }
      }
    }

    // MARK: - DynamicArrayType

    describe("DynamicArrayType") {
      it("is created") {
        expect(~[Double].self).to(beAKindOf(DynamicArrayType.self))
        expect(~[String?].self).to(beAKindOf(DynamicArrayType.self))
        expect(~[[Int]].self).to(beAKindOf(DynamicArrayType.self))
      }
      describe("casts") {
        it("succeeds") {
          expect(try (~[Double].self).cast([1.2, 3.4], appContext: appContext) as? [Double]) == [1.2, 3.4]
          expect(try (~[[String]].self).cast([["hello", "expo"]], appContext: appContext) as? [[String]]) == [["hello", "expo"]]
        }
        it("casts arrays") {
          let value = 9.9
          let anyValue = [value] as [Any]
          let result = try (~[Double].self).cast(anyValue, appContext: appContext) as! [Any]

          expect(result).to(beAKindOf([Double].self))
          expect(result as? [Double]) == [value]
        }
        it("arrayizes single element") {
          // The dynamic array type can arrayize the single element
          // if only the array element's dynamic type can cast it.
          expect(try (~[Int].self).cast(50, appContext: appContext) as? [Int]) == [50]
          expect(try (~[String].self).cast("not an array", appContext: appContext) as? [String]) == ["not an array"]
        }
        it("throws CastingException") {
          expect { try (~[String].self).cast(84, appContext: appContext) }.to(
            throwError(errorType: Conversions.CastingException<String>.self)
          )
        }
      }
      describe("wraps") {
        it("is true") {
          expect(~[Double].self ~> [Double].self) == true
          expect(~[[String]].self ~> [[String]].self) == true
          expect(~[CGPoint].self ~> [CGPoint].self) == true
        }
        it("is false") {
          expect(~[String].self !~> [Int].self) == true
          expect(~[Promise].self !~> Promise.self) == true
        }
      }
      describe("equals") {
        it("is true") {
          expect(~[String].self == ~[String].self) == true
          expect(~[CGSize].self == ~[CGSize].self) == true
          expect(~[[[Double]]].self == ~[[[Double]]].self) == true
        }
        it("is false") {
          expect(~[Int].self != ~[Double].self) == true
          expect(~[[String]].self != ~[String].self) == true
          expect(~[URL].self != ~[String].self) == true
        }
      }
    }

    // MARK: - DynamicConvertibleType

    describe("DynamicConvertibleType") {
      it("is created") {
        expect(~CGPoint.self).to(beAKindOf(DynamicConvertibleType.self))
        expect(~CGRect.self).to(beAKindOf(DynamicConvertibleType.self))
        expect(~CGColor.self).to(beAKindOf(DynamicConvertibleType.self))
        expect(~URL.self).to(beAKindOf(DynamicConvertibleType.self))
      }
      describe("casts") {
        it("succeeds") {
          expect(try (~CGPoint.self).cast([2.1, 3.7], appContext: appContext) as? CGPoint) == CGPoint(x: 2.1, y: 3.7)
          expect(try (~CGVector.self).cast(["dx": 0.8, "dy": 4.1], appContext: appContext) as? CGVector) == CGVector(dx: 0.8, dy: 4.1)
          expect(try (~URL.self).cast("/test/path", appContext: appContext) as? URL) == URL(fileURLWithPath: "/test/path")
        }
        it("throws ConvertingException") {
          expect { try (~CGRect.self).cast("not a rect", appContext: appContext) as? CGRect }.to(
            throwError(errorType: Conversions.ConvertingException<CGRect>.self)
          )
        }
      }
      describe("wraps") {
        it("is true") {
          expect(~CGRect.self ~> CGRect.self) == true
          expect(~CGColor.self ~> CGColor.self) == true
          expect(~URL.self ~> URL.self) == true
        }
        it("is false") {
          expect(~CGRect.self !~> Double.self) == true
          expect(~CGColor.self !~> CGRect.self) == true
          expect(~URL.self !~> String.self) == true
        }
      }
      describe("equals") {
        it("is true") {
          expect(~CGSize.self == ~CGSize.self) == true
          expect(~URL.self == ~URL.self) == true
          expect(~UIColor.self == ~UIColor.self) == true
        }
        it("is false") {
          expect(~CGSize.self != ~CGRect.self) == true
          expect(~CGPoint.self != ~CGVector.self) == true
          expect(~URL.self != ~String.self) == true
        }
      }
    }

    // MARK: - DynamicEnumType

    describe("DynamicEnumType") {
      enum StringTestEnum: String, Enumerable {
        case hello
        case expo
      }
      enum IntTestEnum: Int, Enumerable {
        case negative = -1
        case positive = 1
      }

      it("is created") {
        expect(~StringTestEnum.self).to(beAKindOf(DynamicEnumType.self))
        expect(~IntTestEnum.self).to(beAKindOf(DynamicEnumType.self))
      }
      describe("casts") {
        it("succeeds") {
          expect(try (~StringTestEnum.self).cast("expo", appContext: appContext) as? StringTestEnum) == .expo
          expect(try (~IntTestEnum.self).cast(1, appContext: appContext) as? IntTestEnum) == .positive
        }
        it("throws EnumNoSuchValueException") {
          expect { try (~StringTestEnum.self).cast("react native", appContext: appContext) as? StringTestEnum }.to(
            throwError(errorType: EnumNoSuchValueException.self)
          )
        }
        it("throws EnumCastingException") {
          expect { try (~IntTestEnum.self).cast(true, appContext: appContext) as? StringTestEnum }.to(
            throwError(errorType: EnumCastingException.self)
          )
        }
      }
      describe("wraps") {
        it("is true") {
          expect(~StringTestEnum.self ~> StringTestEnum.self) == true
          expect(~IntTestEnum.self ~> IntTestEnum.self) == true
        }
        it("is false") {
          expect(~StringTestEnum.self !~> IntTestEnum.self) == true
          expect(~IntTestEnum.self !~> StringTestEnum.self) == true
        }
      }

      describe("equals") {
        it("is true") {
          expect(~StringTestEnum.self == ~StringTestEnum.self) == true
          expect(~IntTestEnum.self == ~IntTestEnum.self) == true
        }
        it("is false") {
          expect(~StringTestEnum.self != ~IntTestEnum.self) == true
          expect(~IntTestEnum.self != ~StringTestEnum.self) == true
          expect(~StringTestEnum.self != ~Double.self) == true
          expect(~IntTestEnum.self != ~Int.self) == true
        }
      }
    }

    // MARK: - DynamicOptionalType

    describe("DynamicOptionalType") {
      it("is created") {
        expect(~String?.self).to(beAKindOf(DynamicOptionalType.self))
        expect(~[Double]?.self).to(beAKindOf(DynamicOptionalType.self))
        expect(~[Int?]?.self).to(beAKindOf(DynamicOptionalType.self))
      }
      describe("casts") {
        it("succeeds") {
          expect(try (~String?.self).cast("expo", appContext: appContext) as? String) == "expo"
          expect(try (~Bool?.self).cast(false, appContext: appContext) as? Bool) == false
        }
        it("succeeds with nil") {
          let value: Double? = nil
          let result = try (~Double?.self).cast(value as Any, appContext: appContext)

          expect(result).to(beAKindOf(Double?.self))

          // Since this `nil` is in fact of non-optional `Any` type, under the hood it's described as `Optional` enum.
          // Simply checking `result == nil` does NOT work here, see `Optional.isNil` extension implementation.
          expect(Optional.isNil(result)) == true
        }
        it("succeeds with NSNull") {
          let value = NSNull()
          let result = try (~Double?.self).cast(value as Any, appContext: appContext)
          expect(result).to(beAKindOf(Double?.self))
          expect(Optional.isNil(result)) == true
        }
        it("throws CastingException") {
          expect { try (~Double?.self).cast("a string", appContext: appContext) as? Double }.to(
            throwError(errorType: Conversions.CastingException<Double>.self)
          )
        }
      }
      describe("wraps") {
        it("is true") {
          expect(~Double?.self ~> Double?.self) == true
          expect(~String?.self ~> String?.self) == true
          expect(~URL?.self ~> URL?.self) == true
        }
        it("is false") {
          expect(~Double?.self !~> Double.self) == true
          expect(~[URL]?.self !~> URL.self) == true
          expect(~[String]?.self !~> [String?].self) == true
        }
      }
      describe("equals") {
        it("is true") {
          expect(~Int?.self == ~Int?.self) == true
          expect(~ExpoSpec.self == ~ExpoSpec.self) == true
        }
        it("is false") {
          expect(~Double?.self != ~Double.self) == true
          expect(~Int?.self != ~Double?.self) == true
          expect(~[Bool]?.self != ~[Bool].self) == true
        }
      }
    }

    // MARK: - DynamicSharedObjectType

    describe("DynamicSharedObjectType") {
      class TestSharedObject: SharedObject {}

      it("is created") {
        expect(~TestSharedObject.self).to(beAKindOf(DynamicSharedObjectType.self))
      }
      describe("casts") {
        it("succeeds") {
          let appContext = AppContext.create()
          let nativeObject = TestSharedObject()
          let jsObjectValue = try appContext.runtime.eval("({})")

          SharedObjectRegistry.add(native: nativeObject, javaScript: try jsObjectValue.asObject())

          // `DynamicSharedObjectType` only supports casting
          // from `JavaScriptValue`, but not from `JavaScriptObject`.
          expect(try (~TestSharedObject.self).cast(jsValue: jsObjectValue, appContext: appContext) as? TestSharedObject) === nativeObject
        }
        it("throws NativeSharedObjectNotFoundException") {
          expect { try (~TestSharedObject.self).cast("a string", appContext: appContext) as? TestSharedObject }.to(
            throwError(errorType: NativeSharedObjectNotFoundException.self)
          )
        }
      }
      describe("wraps") {
        it("is true") {
          expect(~TestSharedObject.self ~> TestSharedObject.self) == true
        }
        it("is false") {
          expect(~TestSharedObject.self !~> SharedObject.self) == true
          expect(~TestSharedObject.self !~> String?.self) == true
        }
      }
      describe("equals") {
        it("is true") {
          expect(~TestSharedObject.self == ~TestSharedObject.self) == true
          expect(~TestSharedObject?.self == ~TestSharedObject?.self) == true
          expect(~[TestSharedObject].self == ~[TestSharedObject].self) == true
        }
        it("is false") {
          expect(~TestSharedObject.self != ~TestSharedObject?.self) == true
          expect(~TestSharedObject.self != ~[String: Any].self) == true
          expect(~TestSharedObject.self != ~[TestSharedObject].self) == true
        }
      }
    }
  }
}
