// Copyright 2018-present 650 Industries. All rights reserved.

import CoreGraphics
import ExpoModulesTestCore

@testable import ExpoModulesCore

class ConvertiblesSpec: ExpoSpec {
  override func spec() {
    let appContext = AppContext.create()

    describe("URL") {
      it("converts from remote url") {
        let remoteUrlString = "https://expo.dev"
        let url = try URL.convert(from: remoteUrlString, appContext: appContext)

        expect(url.path) == ""
        expect(url.absoluteString) == remoteUrlString
      }

      it("converts from url with unencoded query") {
        let query = "param=🥓"
        let urlString = "https://expo.dev/?\(query)"
        let url = try URL.convert(from: urlString, appContext: appContext)

        if #available(iOS 16.0, *) {
          expect(url.query(percentEncoded: true)) == "param=%F0%9F%A5%93"
          expect(url.query(percentEncoded: false)) == query
        }
        expect(url.query) == "param=%F0%9F%A5%93"
        expect(url.absoluteString) == "https://expo.dev/?param=%F0%9F%A5%93"
        expect(url.absoluteString.removingPercentEncoding) == urlString
      }

      it("converts from url with encoded query") {
        let query = "param=%F0%9F%A5%93"
        let urlString = "https://expo.dev/?\(query)"
        let url = try URL.convert(from: urlString, appContext: appContext)

        if #available(iOS 16.0, *) {
          expect(url.query(percentEncoded: true)) == query
          expect(url.query(percentEncoded: false)) == "param=🥓"
        }
        expect(url.query) == query
        expect(url.absoluteString) == urlString
        expect(url.absoluteString.removingPercentEncoding) == "https://expo.dev/?param=🥓"
      }
      
      it("converts from url with encoded query containg the anchor") {
        let query = "color=%230000ff"
        let urlString = "https://expo.dev/?\(query)#anchor"
        let url = try URL.convert(from: urlString, appContext: appContext)

        expect(url.query) == query
        expect(url.absoluteString) == urlString
        expect(url.absoluteString.removingPercentEncoding) == "https://expo.dev/?color=#0000ff#anchor"
        expect(url.fragment) == "anchor"
      }

      it("converts from url with encoded path") {
        let path = "/expo/%2F%25%3F%5E%26/test" // -> /expo//%?^&/test
        let urlString = "https://expo.dev\(path)"
        let url = try URL.convert(from: urlString, appContext: appContext)

        expect(url.absoluteString) == urlString
        expect(url.path) == path.removingPercentEncoding

        if #available(iOS 16.0, *) {
          expect(url.path(percentEncoded: true)) == path
          expect(url.path(percentEncoded: false)) == path.removingPercentEncoding
        }
      }

      it("converts from url containing the anchor") {
        // The hash is not allowed in the query (requires percent-encoding),
        // but we want it to be recognized as the beginning of the fragment,
        // thus it cannot be percent-encoded.
        let query = "param=#expo"
        let urlString = "https://expo.dev/?\(query)"
        let url = try URL.convert(from: urlString, appContext: appContext)

        expect(url.query) == "param="
        expect(url.fragment) == "expo"
        expect(url.absoluteString) == urlString
      }

      it("converts from file url") {
        let fileUrlString = "file:///expo/tmp"
        let url = try URL.convert(from: fileUrlString, appContext: appContext)

        expect(url.path) == "/expo/tmp"
        expect(url.absoluteString) == fileUrlString
        expect(url.isFileURL) == true
      }

      it("converts from file path") {
        let filePath = "/expo/image.png"
        let url = try URL.convert(from: filePath, appContext: appContext)

        expect(url.scheme) == "file"
        expect(url.path) == filePath
        expect(url.absoluteString) == "file://\(filePath)"
        expect(url.isFileURL) == true
      }

      it("converts from file path with UTF8 characters") {
        let filePath = "/中文ÅÄÖąÓśĆñ.gif"
        let url = try URL.convert(from: filePath, appContext: appContext)

        expect(url.scheme) == "file"
        expect(url.path) == filePath
        expect(url.isFileURL) == true
      }

      it("converts from file path containing percent character") {
        let filePath = "/%.png"
        let url = try URL.convert(from: filePath, appContext: appContext)

        expect(url.scheme) == "file"
        expect(url.path) == filePath
        expect(url.isFileURL) == true
      }

      it("throws when no string") {
        expect { try URL.convert(from: 29.5, appContext: appContext) }.to(
          throwError(errorType: Conversions.ConvertingException<URL>.self)
        )
      }
    }

    describe("CGPoint") {
      let x = -8.3
      let y = 4.6

      it("converts from array of doubles") {
        let point = try CGPoint.convert(from: [x, y], appContext: appContext)

        expect(point.x) == x
        expect(point.y) == y
      }

      it("converts from dict") {
        let point = try CGPoint.convert(from: ["x": x, "y": y], appContext: appContext)

        expect(point.x) == x
        expect(point.y) == y
      }

      it("throws when array size is unexpected") { // different than two
        expect { try CGPoint.convert(from: [], appContext: appContext) }.to(
          throwError(errorType: Conversions.ConvertingException<CGPoint>.self)
        )
        expect { try CGPoint.convert(from: [x], appContext: appContext) }.to(
          throwError(errorType: Conversions.ConvertingException<CGPoint>.self)
        )
        expect { try CGPoint.convert(from: [x, y, x], appContext: appContext) }.to(
          throwError(errorType: Conversions.ConvertingException<CGPoint>.self)
        )
      }

      it("throws when dict is missing some keys") {
        expect { try CGPoint.convert(from: ["test": x], appContext: appContext) }.to(throwError {
          expect($0).to(beAKindOf(Conversions.MissingKeysException<Double>.self))
          expect(($0 as! CodedError).description) == Conversions.MissingKeysException<Double>(["x", "y"]).description
        })
      }

      it("throws when dict has uncastable keys") {
        expect { try CGPoint.convert(from: ["x": x, "y": "string"], appContext: appContext) }.to(throwError {
          expect($0).to(beAKindOf(Conversions.CastingValuesException<Double>.self))
          expect(($0 as! CodedError).description) == Conversions.CastingValuesException<Double>(["y"]).description
        })
      }
    }

    describe("CGSize") {
      let width = 52.8
      let height = 81.7

      it("converts from array of doubles") {
        let size = try CGSize.convert(from: [width, height], appContext: appContext)

        expect(size.width) == width
        expect(size.height) == height
      }

      it("converts from dict") {
        let size = try CGSize.convert(from: ["width": width, "height": height], appContext: appContext)

        expect(size.width) == width
        expect(size.height) == height
      }

      it("throws when array size is unexpected") { // different than two
        expect { try CGSize.convert(from: [], appContext: appContext) }.to(
          throwError(errorType: Conversions.ConvertingException<CGSize>.self)
        )
        expect { try CGSize.convert(from: [width], appContext: appContext) }.to(
          throwError(errorType: Conversions.ConvertingException<CGSize>.self)
        )
        expect { try CGSize.convert(from: [width, height, width], appContext: appContext) }.to(
          throwError(errorType: Conversions.ConvertingException<CGSize>.self)
        )
      }

      it("throws when dict is missing some keys") {
        expect { try CGSize.convert(from: ["width": width], appContext: appContext) }.to(throwError {
          expect($0).to(beAKindOf(Conversions.MissingKeysException<Double>.self))
          expect(($0 as! CodedError).description) == Conversions.MissingKeysException<Double>(["height"]).description
        })
      }

      it("throws when dict has uncastable keys") {
        expect { try CGSize.convert(from: ["width": "test", "height": height], appContext: appContext) }.to(throwError {
          expect($0).to(beAKindOf(Conversions.CastingValuesException<Double>.self))
          expect(($0 as! CodedError).description) == Conversions.CastingValuesException<Double>(["width"]).description
        })
      }
    }

    describe("CGVector") {
      let dx = 11.6
      let dy = -4.0

      it("converts from array of doubles") {
        let vector = try CGVector.convert(from: [dx, dy], appContext: appContext)

        expect(vector.dx) == dx
        expect(vector.dy) == dy
      }

      it("converts from dict") {
        let vector = try CGVector.convert(from: ["dx": dx, "dy": dy], appContext: appContext)

        expect(vector.dx) == dx
        expect(vector.dy) == dy
      }

      it("throws when array size is unexpected") { // different than two
        expect { try CGVector.convert(from: [], appContext: appContext) }.to(
          throwError(errorType: Conversions.ConvertingException<CGVector>.self)
        )
        expect { try CGVector.convert(from: [dx], appContext: appContext) }.to(
          throwError(errorType: Conversions.ConvertingException<CGVector>.self)
        )
        expect { try CGVector.convert(from: [dx, dy, dx], appContext: appContext) }.to(
          throwError(errorType: Conversions.ConvertingException<CGVector>.self)
        )
      }

      it("throws when dict is missing some keys") {
        expect { try CGVector.convert(from: ["dx": dx], appContext: appContext) }.to(throwError {
          expect($0).to(beAKindOf(Conversions.MissingKeysException<Double>.self))
          expect(($0 as! CodedError).description) == Conversions.MissingKeysException<Double>(["dy"]).description
        })
      }

      it("throws when dict has uncastable keys") {
        expect { try CGVector.convert(from: ["dx": "dx", "dy": dy], appContext: appContext) }.to(throwError {
          expect($0).to(beAKindOf(Conversions.CastingValuesException<Double>.self))
          expect(($0 as! CodedError).description) == Conversions.CastingValuesException<Double>(["dx"]).description
        })
      }
    }

    describe("CGRect") {
      let x = -8.3
      let y = 4.6
      let width = 52.8
      let height = 81.7

      it("converts from array of doubles") {
        let rect = try CGRect.convert(from: [x, y, width, height], appContext: appContext)

        expect(rect.origin.x) == x
        expect(rect.origin.y) == y
        expect(rect.width) == width
        expect(rect.height) == height
      }

      it("converts from dict") {
        let rect = try CGRect.convert(from: ["x": x, "y": y, "width": width, "height": height], appContext: appContext)

        expect(rect.origin.x) == x
        expect(rect.origin.y) == y
        expect(rect.width) == width
        expect(rect.height) == height
      }

      it("throws when array size is unexpected") { // different than four
        expect { try CGRect.convert(from: [x], appContext: appContext) }.to(
          throwError(errorType: Conversions.ConvertingException<CGRect>.self)
        )
        expect { try CGRect.convert(from: [x, y], appContext: appContext) }.to(
          throwError(errorType: Conversions.ConvertingException<CGRect>.self)
        )
        expect { try CGRect.convert(from: [x, y, width, height, y], appContext: appContext) }.to(
          throwError(errorType: Conversions.ConvertingException<CGRect>.self)
        )
      }

      it("throws when dict is missing some keys") {
        expect { try CGRect.convert(from: ["x": x], appContext: appContext) }.to(throwError {
          expect($0).to(beAKindOf(Conversions.MissingKeysException<Double>.self))
          expect(($0 as! CodedError).description) == Conversions.MissingKeysException<Double>(["y", "width", "height"]).description
        })
      }

      it("throws when dict has uncastable keys") {
        expect { try CGRect.convert(from: ["x": x, "y": nil, "width": width, "height": "\(height)"], appContext: appContext) }.to(throwError {
          expect($0).to(beAKindOf(Conversions.CastingValuesException<Double>.self))
          expect(($0 as! CodedError).description) == Conversions.CastingValuesException<Double>(["y", "height"]).description
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
        expect { try CGColor.convert(from: hex, appContext: appContext) }.to(throwError {
          expect($0).to(beAKindOf(Conversions.InvalidHexColorException.self))
          expect(($0 as! CodedError).description) == Conversions.InvalidHexColorException(hex).description
        })
      }

      it("converts from ARGB int") {
        // NOTE: int representation has alpha channel at the beginning
        let color = try CGColor.convert(from: 0x5147AC7F, appContext: appContext)
        testColorComponents(color, 0x47, 0xAC, 0x7F, 0x51)
      }

      it("converts from RGBA hex string") {
        let color = try CGColor.convert(from: "47AC7F51", appContext: appContext)
        testColorComponents(color, 0x47, 0xAC, 0x7F, 0x51)
      }

      it("converts from #RGBA hex string") {
        let color = try CGColor.convert(from: " #47AC7F51", appContext: appContext)
        testColorComponents(color, 0x47, 0xAC, 0x7F, 0x51)
      }

      it("converts from 3-character shorthand hex string") {
        let color = try CGColor.convert(from: "C2B ", appContext: appContext)
        testColorComponents(color, 0xCC, 0x22, 0xBB, 0xFF)
      }

      it("converts from 4-character shorthand hex string") {
        let color = try CGColor.convert(from: " #9EA5 ", appContext: appContext)
        testColorComponents(color, 0x99, 0xEE, 0xAA, 0x55)
      }

      it("converts from CSS named color") {
        let papayawhip = try CGColor.convert(from: "papayawhip", appContext: appContext)
        testColorComponents(papayawhip, 0xFF, 0xEF, 0xD5, 0xFF)
      }

      it("converts from transparent") {
        let transparent = try CGColor.convert(from: "transparent", appContext: appContext)
        expect(transparent.alpha) == .zero
      }

      it("throws when string is invalid") {
        testInvalidHexColor("")
        testInvalidHexColor("#21")
        testInvalidHexColor("ABCDEFGH")
        testInvalidHexColor("1122334455")
        testInvalidHexColor("XYZ")
        testInvalidHexColor("!@#$%")
      }

      it("throws when int overflows") {
        let hex = 0xBBAA88FF2
        expect { try CGColor.convert(from: hex, appContext: appContext) }.to(throwError {
          expect($0).to(beAKindOf(Conversions.HexColorOverflowException.self))
          expect(($0 as! CodedError).description) == Conversions.HexColorOverflowException(UInt64(hex)).description
        })
      }
    }
  }
}
