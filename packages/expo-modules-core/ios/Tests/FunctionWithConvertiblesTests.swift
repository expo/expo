// Copyright 2018-present 650 Industries. All rights reserved.

import CoreGraphics
import Testing

@testable import ExpoModulesCore

@Suite("FunctionWithConvertibles")
@JavaScriptActor
struct FunctionWithConvertiblesTests {
  let appContext: AppContext
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() {
    appContext = AppContext.create()
    appContext.moduleRegistry.register(holder: mockModuleHolder(appContext) {
      Name("TestModule")

      Function("withCGTypes") { (point: CGPoint, size: CGSize, vector: CGVector, rect: CGRect) -> [String: Any] in
        return [
          "px": Double(point.x),
          "py": Double(point.y),
          "sw": Double(size.width),
          "sh": Double(size.height),
          "vdx": Double(vector.dx),
          "vdy": Double(vector.dy),
          "rx": Double(rect.origin.x),
          "ry": Double(rect.origin.y),
          "rw": Double(rect.width),
          "rh": Double(rect.height),
        ]
      }

      Function("withCGColor") { (color: CGColor) -> [CGFloat] in
        return Array(color.components ?? [])
      }

      Function("withConvertibles") { TestRecord() }
    })
  }

  @Test
  func `converts arguments to CoreGraphics types`() throws {
    let result = try runtime.eval("""
      expo.modules.TestModule.withCGTypes([18.3, -4.1], {width: 734.6, height: 592.1}, {dx: 18.3, dy: -4.1}, [18.3, -4.1, 734.6, 592.1])
    """)

    let obj = result.getObject()
    #expect(obj.getProperty("px").getDouble() == 18.3)
    #expect(obj.getProperty("py").getDouble() == -4.1)
    #expect(obj.getProperty("sw").getDouble() == 734.6)
    #expect(obj.getProperty("sh").getDouble() == 592.1)
    #expect(obj.getProperty("vdx").getDouble() == 18.3)
    #expect(obj.getProperty("vdy").getDouble() == -4.1)
    #expect(obj.getProperty("rx").getDouble() == 18.3)
    #expect(obj.getProperty("ry").getDouble() == -4.1)
    #expect(obj.getProperty("rw").getDouble() == 734.6)
    #expect(obj.getProperty("rh").getDouble() == 592.1)
  }

  @Test
  func `converts arguments to CGColor`() throws {
    let result = try runtime.eval("expo.modules.TestModule.withCGColor('#2A4B5D')")
    let components = result.getArray()

    #expect(components.length == 4)
    #expect(abs(try components.getValue(at: 0).asDouble() - Double(0x2A) / 255.0) < 0.001)
    #expect(abs(try components.getValue(at: 1).asDouble() - Double(0x4B) / 255.0) < 0.001)
    #expect(abs(try components.getValue(at: 2).asDouble() - Double(0x5D) / 255.0) < 0.001)
    #expect(abs(try components.getValue(at: 3).asDouble() - 1.0) < 0.001)
  }

  @Test
  func `converts convertibles in records`() throws {
    let object = try runtime.eval("expo.modules.TestModule.withConvertibles()")
    #expect(object.kind == .object)

    #expect(object.getObject().hasProperty("url") == true)
    #expect(object.getObject().hasProperty("cgFloat") == true)
    #expect(object.getObject().hasProperty("cgPoint") == true)
    #expect(object.getObject().hasProperty("cgSize") == true)
    #expect(object.getObject().hasProperty("cgVector") == true)
    #expect(object.getObject().hasProperty("cgRect") == true)
    #expect(object.getObject().hasProperty("cgColor") == true)

    #expect(object.getObject().getProperty("url").kind == .string)
    #expect(object.getObject().getProperty("url").getString() == "https://expo.dev/")

    #expect(object.getObject().getProperty("cgFloat").kind == .number)
    #expect(object.getObject().getProperty("cgFloat").getDouble() == 1.0)

    let cgPoint = object.getObject().getProperty("cgPoint")
    #expect(cgPoint.kind == .object)
    #expect(cgPoint.getObject().getProperty("x").getDouble() == 1.0)
    #expect(cgPoint.getObject().getProperty("y").getDouble() == 2.0)

    let cgSize = object.getObject().getProperty("cgSize")
    #expect(cgSize.kind == .object)
    #expect(cgSize.getObject().getProperty("width").getDouble() == 100.0)
    #expect(cgSize.getObject().getProperty("height").getDouble() == 200.0)

    let cgVector = object.getObject().getProperty("cgVector")
    #expect(cgVector.kind == .object)
    #expect(cgVector.getObject().getProperty("dx").getDouble() == 100.0)
    #expect(cgVector.getObject().getProperty("dy").getDouble() == 200.0)

    let cgRect = object.getObject().getProperty("cgRect")
    #expect(cgRect.kind == .object)
    #expect(cgRect.getObject().getProperty("x").getDouble() == 50.0)
    #expect(cgRect.getObject().getProperty("y").getDouble() == 100.0)
    #expect(cgRect.getObject().getProperty("width").getDouble() == 200.0)
    #expect(cgRect.getObject().getProperty("height").getDouble() == 300.0)

    #expect(object.getObject().getProperty("cgColor").kind == .string)
    #expect(object.getObject().getProperty("cgColor").getString() == "#ff0000ff")

    #expect(object.getObject().getProperty("uiColor").kind == .string)
    #expect(object.getObject().getProperty("uiColor").getString() == "#00ff00ff")
  }
}

private struct TestRecord: Record {
  @Field var url: URL = URL.init(string: "https://expo.dev/")!
  @Field var cgFloat: CGFloat = CGFloat(1.0)
  @Field var cgPoint: CGPoint = CGPoint(x: 1, y: 2)
  @Field var cgSize: CGSize = CGSize(width: 100, height: 200)
  @Field var cgVector: CGVector = CGVector(dx: 100, dy: 200)
  @Field var cgRect: CGRect = CGRect(x: 50, y: 100, width: 200, height: 300)
  @Field var cgColor: CGColor = UIColor.red.cgColor
  @Field var uiColor: UIColor = UIColor.green
}
