// Copyright 2018-present 650 Industries. All rights reserved.

import CoreGraphics
import ExpoModulesTestCore

@testable import ExpoModulesCore

class FunctionWithConvertiblesSpec: ExpoSpec {
  override func spec() {
    let appContext = AppContext()
    let functionName = "function"

    it("converts arguments to CoreGraphics types") {
      let x = 18.3
      let y = -4.1
      let width = 734.6
      let height = 592.1

      mockModuleHolder(appContext) {
        AsyncFunction(functionName) { (point: CGPoint, size: CGSize, vector: CGVector, rect: CGRect) in
          expect(point.x) == x
          expect(point.y) == y
          expect(size.width) == width
          expect(size.height) == height
          expect(vector.dx) == x
          expect(vector.dy) == y
          expect(rect.origin.x) == x
          expect(rect.origin.y) == y
          expect(rect.width) == width
          expect(rect.height) == height
        }
      }
      .callSync(function: functionName, args: [
        [x, y], // point
        ["width": width, "height": height], // size
        ["dx": x, "dy": y], // vector
        [x, y, width, height] // rect
      ])
    }

    it("converts arguments to CGColor") {
      func testColorComponents(_ color: CGColor, _ red: CGFloat, _ green: CGFloat, _ blue: CGFloat, _ alpha: CGFloat) {
        expect(color.components?[0]) == red   / 255.0
        expect(color.components?[1]) == green / 255.0
        expect(color.components?[2]) == blue  / 255.0
        expect(color.components?[3]) == alpha / 255.0
      }

      mockModuleHolder(appContext) {
        AsyncFunction(functionName) { (color1: CGColor, color2: CGColor, color3: CGColor, color4: CGColor) in
          testColorComponents(color1, 0x2A, 0x4B, 0x5D, 0xFF)
          testColorComponents(color2, 0x11, 0xFF, 0x00, 0xDD)
          testColorComponents(color3, 0x66, 0x00, 0xCC, 0xAA)
          testColorComponents(color4, 0x00, 0x00, 0x00, 0x00)
        }
      }
      .callSync(function: functionName, args: [
        "#2A4B5D",
        0xDD11FF00,
        "60CA",
        0
      ])
    }
  }
}
