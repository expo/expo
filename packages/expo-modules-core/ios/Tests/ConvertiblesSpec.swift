// Copyright 2018-present 650 Industries. All rights reserved.

import CoreGraphics
import Quick
import Nimble

@testable import ExpoModulesCore

class ConvertiblesSpec: QuickSpec {
  override func spec() {
    describe("URL") {
      it("converts from remote url") {
        let remoteUrlString = "https://expo.dev"
        let url = try URL.convert(from: remoteUrlString)

        expect(url.path) == ""
        expect(url.absoluteString) == remoteUrlString
      }

      it("converts from file url") {
        let fileUrlString = "file:///expo/tmp"
        let url = try URL.convert(from: fileUrlString)

        expect(url.path) == "/expo/tmp"
        expect(url.absoluteString) == fileUrlString
        expect(url.isFileURL) == true
      }

      it("converts from file path") {
        let filePath = "/expo/image.png"
        let url = try URL.convert(from: filePath)

        expect(url.path) == filePath
        expect(url.absoluteString) == "file://\(filePath)"
        expect(url.isFileURL) == true
      }

      it("throws when no string") {
        expect { try URL.convert(from: 29.5) }.to(
          throwError(errorType: Conversions.ConvertingError<URL>.self)
        )
      }
    }

    describe("CGPoint") {
      let x = -8.3
      let y = 4.6

      it("converts from array of doubles") {
        let point = try CGPoint.convert(from: [x, y])

        expect(point.x) == x
        expect(point.y) == y
      }

      it("converts from dict") {
        let point = try CGPoint.convert(from: ["x": x, "y": y])

        expect(point.x) == x
        expect(point.y) == y
      }

      it("throws when array size is unexpected") { // different than two
        expect { try CGPoint.convert(from: []) }.to(throwError(errorType: Conversions.ConvertingError<CGPoint>.self))
        expect { try CGPoint.convert(from: [x]) }.to(throwError(errorType: Conversions.ConvertingError<CGPoint>.self))
        expect { try CGPoint.convert(from: [x, y, x]) }.to(throwError(errorType: Conversions.ConvertingError<CGPoint>.self))
      }

      it("throws when dict is missing some keys") {
        expect { try CGPoint.convert(from: ["test": x]) }.to(throwError {
          expect($0).to(beAKindOf(Conversions.MissingKeysError<Double>.self))
          expect(($0 as! CodedError).description) == Conversions.MissingKeysError<Double>(keys: ["x", "y"]).description
        })
      }

      it("throws when dict has uncastable keys") {
        expect { try CGPoint.convert(from: ["x": x, "y": "string"]) }.to(throwError {
          expect($0).to(beAKindOf(Conversions.CastingValuesError<Double>.self))
          expect(($0 as! CodedError).description) == Conversions.CastingValuesError<Double>(keys: ["y"]).description
        })
      }
    }

    describe("CGSize") {
      let width = 52.8
      let height = 81.7

      it("converts from array of doubles") {
        let size = try CGSize.convert(from: [width, height])

        expect(size.width) == width
        expect(size.height) == height
      }

      it("converts from dict") {
        let size = try CGSize.convert(from: ["width": width, "height": height])

        expect(size.width) == width
        expect(size.height) == height
      }

      it("throws when array size is unexpected") { // different than two
        expect { try CGSize.convert(from: []) }.to(throwError(errorType: Conversions.ConvertingError<CGSize>.self))
        expect { try CGSize.convert(from: [width]) }.to(throwError(errorType: Conversions.ConvertingError<CGSize>.self))
        expect { try CGSize.convert(from: [width, height, width]) }.to(throwError(errorType: Conversions.ConvertingError<CGSize>.self))
      }

      it("throws when dict is missing some keys") {
        expect { try CGSize.convert(from: ["width": width]) }.to(throwError {
          expect($0).to(beAKindOf(Conversions.MissingKeysError<Double>.self))
          expect(($0 as! CodedError).description) == Conversions.MissingKeysError<Double>(keys: ["height"]).description
        })
      }

      it("throws when dict has uncastable keys") {
        expect { try CGSize.convert(from: ["width": "test", "height": height]) }.to(throwError {
          expect($0).to(beAKindOf(Conversions.CastingValuesError<Double>.self))
          expect(($0 as! CodedError).description) == Conversions.CastingValuesError<Double>(keys: ["width"]).description
        })
      }
    }

    describe("CGVector") {
      let dx = 11.6
      let dy = -4.0

      it("converts from array of doubles") {
        let vector = try CGVector.convert(from: [dx, dy])

        expect(vector.dx) == dx
        expect(vector.dy) == dy
      }

      it("converts from dict") {
        let vector = try CGVector.convert(from: ["dx": dx, "dy": dy])

        expect(vector.dx) == dx
        expect(vector.dy) == dy
      }

      it("throws when array size is unexpected") { // different than two
        expect { try CGVector.convert(from: []) }.to(throwError(errorType: Conversions.ConvertingError<CGVector>.self))
        expect { try CGVector.convert(from: [dx]) }.to(throwError(errorType: Conversions.ConvertingError<CGVector>.self))
        expect { try CGVector.convert(from: [dx, dy, dx]) }.to(throwError(errorType: Conversions.ConvertingError<CGVector>.self))
      }

      it("throws when dict is missing some keys") {
        expect { try CGVector.convert(from: ["dx": dx]) }.to(throwError {
          expect($0).to(beAKindOf(Conversions.MissingKeysError<Double>.self))
          expect(($0 as! CodedError).description) == Conversions.MissingKeysError<Double>(keys: ["dy"]).description
        })
      }

      it("throws when dict has uncastable keys") {
        expect { try CGVector.convert(from: ["dx": "dx", "dy": dy]) }.to(throwError {
          expect($0).to(beAKindOf(Conversions.CastingValuesError<Double>.self))
          expect(($0 as! CodedError).description) == Conversions.CastingValuesError<Double>(keys: ["dx"]).description
        })
      }
    }

    describe("CGRect") {
      let x = -8.3
      let y = 4.6
      let width = 52.8
      let height = 81.7

      it("converts from array of doubles") {
        let rect = try CGRect.convert(from: [x, y, width, height])

        expect(rect.origin.x) == x
        expect(rect.origin.y) == y
        expect(rect.width) == width
        expect(rect.height) == height
      }

      it("converts from dict") {
        let rect = try CGRect.convert(from: ["x": x, "y": y, "width": width, "height": height])

        expect(rect.origin.x) == x
        expect(rect.origin.y) == y
        expect(rect.width) == width
        expect(rect.height) == height
      }

      it("throws when array size is unexpected") { // different than four
        expect { try CGRect.convert(from: [x]) }.to(throwError(errorType: Conversions.ConvertingError<CGRect>.self))
        expect { try CGRect.convert(from: [x, y]) }.to(throwError(errorType: Conversions.ConvertingError<CGRect>.self))
        expect { try CGRect.convert(from: [x, y, width, height, y]) }.to(throwError(errorType: Conversions.ConvertingError<CGRect>.self))
      }

      it("throws when dict is missing some keys") {
        expect { try CGRect.convert(from: ["x": x]) }.to(throwError {
          expect($0).to(beAKindOf(Conversions.MissingKeysError<Double>.self))
          expect(($0 as! CodedError).description) == Conversions.MissingKeysError<Double>(keys: ["y", "width", "height"]).description
        })
      }

      it("throws when dict has uncastable keys") {
        expect { try CGRect.convert(from: ["x": x, "y": nil, "width": width, "height": "\(height)"]) }.to(throwError {
          expect($0).to(beAKindOf(Conversions.CastingValuesError<Double>.self))
          expect(($0 as! CodedError).description) == Conversions.CastingValuesError<Double>(keys: ["y", "height"]).description
        })
      }
    }

    describe("UIColor/CGColor") {
      func testColorComponents(_ color: CGColor, _ red: CGFloat, _ green: CGFloat, _ blue: CGFloat, _ alpha: CGFloat) {
        expect(color.components?[0]) == red   / 255.0
        expect(color.components?[1]) == green / 255.0
        expect(color.components?[2]) == blue  / 255.0
        expect(color.components?[3]) == alpha / 255.0
      }
      func testInvalidHexColor(_ hex: String) {
        expect { try CGColor.convert(from: hex) }.to(throwError {
          expect($0).to(beAKindOf(Conversions.InvalidHexColorError.self))
          expect(($0 as! CodedError).description) == Conversions.InvalidHexColorError(hex: hex).description
        })
      }

      it("converts from ARGB int") {
        // NOTE: int representation has alpha channel at the beginning
        let color = try CGColor.convert(from: 0x5147AC7F)
        testColorComponents(color, 0x47, 0xAC, 0x7F, 0x51)
      }

      it("converts from RGBA hex string") {
        let color = try CGColor.convert(from: "47AC7F51")
        testColorComponents(color, 0x47, 0xAC, 0x7F, 0x51)
      }

      it("converts from #RGBA hex string") {
        let color = try CGColor.convert(from: " #47AC7F51")
        testColorComponents(color, 0x47, 0xAC, 0x7F, 0x51)
      }

      it("converts from 3-character shorthand hex string") {
        let color = try CGColor.convert(from: "C2B ")
        testColorComponents(color, 0xCC, 0x22, 0xBB, 0xFF)
      }

      it("converts from 4-character shorthand hex string") {
        let color = try CGColor.convert(from: " #9EA5 ")
        testColorComponents(color, 0x99, 0xEE, 0xAA, 0x55)
      }

      it("throws when hex string is invalid") {
        testInvalidHexColor("")
        testInvalidHexColor("#21")
        testInvalidHexColor("ABCDEFGH")
        testInvalidHexColor("1122334455")
        testInvalidHexColor("XYZ")
        testInvalidHexColor("!@#$%")
      }

      it("throws when int overflows") {
        let hex = 0xBBAA88FF2
        expect { try CGColor.convert(from: hex) }.to(throwError {
          expect($0).to(beAKindOf(Conversions.HexColorOverflowError.self))
          expect(($0 as! CodedError).description) == Conversions.HexColorOverflowError(hex: UInt64(hex)).description
        })
      }
    }
  }
}
