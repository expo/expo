// Copyright 2018-present 650 Industries. All rights reserved.

import CoreGraphics
import ExpoModulesTestCore

@testable import ExpoModulesCore

class FunctionWithConvertiblesSpec: ExpoSpec {
  override class func spec() {
    let appContext = AppContext.create()
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

    context("Record") {
      let runtime = try! appContext.runtime

      struct TestRecord: Record {
        @Field var url: URL = URL.init(string: "https://expo.dev/")!
        @Field var cgFloat: CGFloat = CGFloat(1.0)
        @Field var cgPoint: CGPoint = CGPoint(x: 1, y: 2)
        @Field var cgSize: CGSize = CGSize(width: 100, height: 200)
        @Field var cgVector: CGVector = CGVector(dx: 100, dy: 200)
        @Field var cgRect: CGRect = CGRect(x: 50, y: 100, width: 200, height: 300)
        @Field var cgColor: CGColor = UIColor.red.cgColor
        @Field var uiColor: UIColor = UIColor.green
      }

      afterEach {
        try runtime.eval("globalThis.result = undefined")
      }

      beforeSuite {
        appContext.moduleRegistry.register(holder: mockModuleHolder(appContext) {
          Name("TestModule")

          Function("withConvertibles") { TestRecord() }
        })
      }

      it("converts convertibles") {
        let object = try runtime.eval("globalThis.result = expo.modules.TestModule.withConvertibles()")
        expect(object.kind) == .object

        expect(object.getObject().hasProperty("url")).to(beTrue())
        expect(object.getObject().hasProperty("cgFloat")).to(beTrue())
        expect(object.getObject().hasProperty("cgPoint")).to(beTrue())
        expect(object.getObject().hasProperty("cgSize")).to(beTrue())
        expect(object.getObject().hasProperty("cgVector")).to(beTrue())
        expect(object.getObject().hasProperty("cgRect")).to(beTrue())
        expect(object.getObject().hasProperty("cgColor")).to(beTrue())

        expect(object.getObject().getProperty("url").kind).to(equal(.string))
        expect(object.getObject().getProperty("url").getString()) == "https://expo.dev/"

        expect(object.getObject().getProperty("cgFloat").kind).to(equal(.number))
        expect(object.getObject().getProperty("cgFloat").getDouble()).to(equal(1.0))

        let cgPoint = object.getObject().getProperty("cgPoint")
        expect(cgPoint.kind).to(equal(.object))
        expect(cgPoint.getObject().getProperty("x").getDouble()).to(equal(1.0))
        expect(cgPoint.getObject().getProperty("y").getDouble()).to(equal(2.0))

        let cgSize = object.getObject().getProperty("cgSize")
        expect(cgSize.kind).to(equal(.object))
        expect(cgSize.getObject().getProperty("width").getDouble()).to(equal(100.0))
        expect(cgSize.getObject().getProperty("height").getDouble()).to(equal(200.0))

        let cgVector = object.getObject().getProperty("cgVector")
        expect(cgVector.kind).to(equal(.object))
        expect(cgVector.getObject().getProperty("dx").getDouble()).to(equal(100.0))
        expect(cgVector.getObject().getProperty("dy").getDouble()).to(equal(200.0))

        let cgRect = object.getObject().getProperty("cgRect")
        expect(cgRect.kind).to(equal(.object))
        expect(cgRect.getObject().getProperty("x").getDouble()).to(equal(50.0))
        expect(cgRect.getObject().getProperty("y").getDouble()).to(equal(100.0))
        expect(cgRect.getObject().getProperty("width").getDouble()).to(equal(200.0))
        expect(cgRect.getObject().getProperty("height").getDouble()).to(equal(300.0))

        expect(object.getObject().getProperty("cgColor").kind).to(equal(.string))
        expect(object.getObject().getProperty("cgColor").getString()).to(equal("#ff0000ff"))

        expect(object.getObject().getProperty("uiColor").kind).to(equal(.string))
        expect(object.getObject().getProperty("uiColor").getString()).to(equal("#00ff00ff"))
      }
    }
  }
}
