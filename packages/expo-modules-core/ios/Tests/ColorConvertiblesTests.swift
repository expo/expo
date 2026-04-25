// Copyright 2015-present 650 Industries. All rights reserved.

import CoreGraphics
import Testing

@testable import ExpoModulesCore

@Suite("Color Convertibles")
struct ColorConvertiblesTests {
  let appContext: AppContext

  init() {
    appContext = AppContext.create()
  }

  private func testColorComponents(
    _ color: CGColor, _ red: CGFloat, _ green: CGFloat, _ blue: CGFloat, _ alpha: CGFloat
  ) {
    #expect(color.components?[0] == red / 255.0)
    #expect(color.components?[1] == green / 255.0)
    #expect(color.components?[2] == blue / 255.0)
    #expect(color.components?[3] == alpha / 255.0)
  }

  private func testColorComponentsApprox(
    _ color: CGColor, _ red: CGFloat, _ green: CGFloat, _ blue: CGFloat, _ alpha: CGFloat
  ) {
    let tolerance: CGFloat = 1.5 / 255.0
    let c = color.components ?? []
    #expect(c.count >= 4)
    guard c.count >= 4 else { return }
    #expect(abs(c[0] - red / 255.0) <= tolerance)
    #expect(abs(c[1] - green / 255.0) <= tolerance)
    #expect(abs(c[2] - blue / 255.0) <= tolerance)
    #expect(abs(c[3] - alpha / 255.0) <= tolerance)
  }

  // MARK: - Hex and Integer Colors

  @Test
  func `converts from ARGB int`() throws {
    // NOTE: int representation has alpha channel at the beginning
    let color = try CGColor.convert(from: 0x5147_AC7F, appContext: appContext)
    testColorComponents(color, 0x47, 0xAC, 0x7F, 0x51)
  }

  @Test
  func `converts from RGBA hex string`() throws {
    let color = try CGColor.convert(from: "47AC7F51", appContext: appContext)
    testColorComponents(color, 0x47, 0xAC, 0x7F, 0x51)
  }

  @Test
  func `converts from #RGBA hex string`() throws {
    let color = try CGColor.convert(from: " #47AC7F51", appContext: appContext)
    testColorComponents(color, 0x47, 0xAC, 0x7F, 0x51)
  }

  @Test
  func `converts from 3-character shorthand hex string`() throws {
    let color = try CGColor.convert(from: "C2B ", appContext: appContext)
    testColorComponents(color, 0xCC, 0x22, 0xBB, 0xFF)
  }

  @Test
  func `converts from 4-character shorthand hex string`() throws {
    let color = try CGColor.convert(from: " #9EA5 ", appContext: appContext)
    testColorComponents(color, 0x99, 0xEE, 0xAA, 0x55)
  }

  @Test
  func `converts from CSS named color`() throws {
    let papayawhip = try CGColor.convert(from: "papayawhip", appContext: appContext)
    testColorComponents(papayawhip, 0xFF, 0xEF, 0xD5, 0xFF)
  }

  @Test
  func `converts from transparent`() throws {
    let transparent = try CGColor.convert(from: "transparent", appContext: appContext)
    #expect(transparent.alpha == .zero)
  }

  @Test
  func `converts from PlatformColor`() throws {
    let color = try CGColor.convert(
      from: ["semantic": ["invalid_color", "systemRed", "systemBlue"]], appContext: appContext)
    #expect(color == UIColor.systemRed.cgColor)
  }

  @Test
  func `converts from DynamicColorIOS`() throws {
    let color = try CGColor.convert(
      from: ["dynamic": ["light": "#000", "dark": ["semantic": "systemGray"]]],
      appContext: appContext)
    #expect(color.components?[0] == 0x00 / 255.0)
    #expect(color.components?[1] == 0x00 / 255.0)
    #expect(color.components?[2] == 0x00 / 255.0)
    #expect(color.components?[3] == 0xFF / 255.0)
  }

  @Test
  func `converts from DynamicColorIOS with traits`() throws {
    let color = try UIColor.convert(
      from: ["dynamic": ["light": "#000", "dark": ["semantic": "systemGray"]]],
      appContext: appContext)
    let traits = UITraitCollection(userInterfaceStyle: .dark)
    #expect(color.resolvedColor(with: traits) == UIColor.systemGray.resolvedColor(with: traits))
  }

  // MARK: - RGB CSS Functions

  @Test
  func `converts from rgb() comma-separated`() throws {
    let color = try CGColor.convert(from: "rgb(255, 0, 128)", appContext: appContext)
    testColorComponents(color, 255, 0, 128, 255)
  }

  @Test
  func `converts from rgba() comma-separated with alpha`() throws {
    let color = try CGColor.convert(from: "rgba(255, 0, 0, 0.5)", appContext: appContext)
    testColorComponentsApprox(color, 255, 0, 0, 127.5)
  }

  @Test
  func `converts from rgb() with percentage values`() throws {
    let color = try CGColor.convert(from: "rgb(100%, 0%, 50%)", appContext: appContext)
    testColorComponentsApprox(color, 255, 0, 127.5, 255)
  }

  @Test
  func `converts from rgb() space-separated`() throws {
    let color = try CGColor.convert(from: "rgb(255 128 0)", appContext: appContext)
    testColorComponentsApprox(color, 255, 128, 0, 255)
  }

  @Test
  func `converts from rgb() space-separated with slash alpha`() throws {
    let color = try CGColor.convert(from: "rgb(255 0 0 / 0.5)", appContext: appContext)
    testColorComponentsApprox(color, 255, 0, 0, 127.5)
  }

  @Test
  func `converts from rgba() with percentage alpha`() throws {
    let color = try CGColor.convert(from: "rgba(255, 0, 0, 50%)", appContext: appContext)
    testColorComponentsApprox(color, 255, 0, 0, 127.5)
  }

  // MARK: - HSL CSS Functions

  @Test
  func `converts from hsl() for pure red`() throws {
    let color = try CGColor.convert(from: "hsl(0, 100%, 50%)", appContext: appContext)
    testColorComponentsApprox(color, 255, 0, 0, 255)
  }

  @Test
  func `converts from hsl() for pure green`() throws {
    let color = try CGColor.convert(from: "hsl(120, 100%, 50%)", appContext: appContext)
    testColorComponentsApprox(color, 0, 255, 0, 255)
  }

  @Test
  func `converts from hsl() for pure blue`() throws {
    let color = try CGColor.convert(from: "hsl(240, 100%, 50%)", appContext: appContext)
    testColorComponentsApprox(color, 0, 0, 255, 255)
  }

  @Test
  func `converts from hsla() comma-separated with alpha`() throws {
    let color = try CGColor.convert(from: "hsla(0, 100%, 50%, 0.5)", appContext: appContext)
    testColorComponentsApprox(color, 255, 0, 0, 127.5)
  }

  @Test
  func `converts from hsl() space-separated`() throws {
    let color = try CGColor.convert(from: "hsl(120 100% 50%)", appContext: appContext)
    testColorComponentsApprox(color, 0, 255, 0, 255)
  }

  @Test
  func `converts from hsl() space-separated with slash alpha`() throws {
    let color = try CGColor.convert(from: "hsl(120 100% 50% / 0.5)", appContext: appContext)
    testColorComponentsApprox(color, 0, 255, 0, 127.5)
  }

  @Test
  func `converts from hsl() with zero saturation for gray`() throws {
    let color = try CGColor.convert(from: "hsl(0, 0%, 50%)", appContext: appContext)
    testColorComponentsApprox(color, 127.5, 127.5, 127.5, 255)
  }

  @Test
  func `converts from hsla() with percentage alpha`() throws {
    let color = try CGColor.convert(from: "hsla(0, 100%, 50%, 50%)", appContext: appContext)
    testColorComponentsApprox(color, 255, 0, 0, 127.5)
  }

  @Test
  func `converts from hsl() with negative hue wrapping`() throws {
    // -120 degrees wraps to 240 degrees (blue)
    let color = try CGColor.convert(from: "hsl(-120, 100%, 50%)", appContext: appContext)
    testColorComponentsApprox(color, 0, 0, 255, 255)
  }

  // MARK: - HWB CSS Functions

  @Test
  func `converts from hwb() for pure red`() throws {
    let color = try CGColor.convert(from: "hwb(0 0% 0%)", appContext: appContext)
    testColorComponentsApprox(color, 255, 0, 0, 255)
  }

  @Test
  func `converts from hwb() for pure green`() throws {
    let color = try CGColor.convert(from: "hwb(120 0% 0%)", appContext: appContext)
    testColorComponentsApprox(color, 0, 255, 0, 255)
  }

  @Test
  func `converts from hwb() for white`() throws {
    let color = try CGColor.convert(from: "hwb(0 100% 0%)", appContext: appContext)
    testColorComponentsApprox(color, 255, 255, 255, 255)
  }

  @Test
  func `converts from hwb() for black`() throws {
    let color = try CGColor.convert(from: "hwb(0 0% 100%)", appContext: appContext)
    testColorComponentsApprox(color, 0, 0, 0, 255)
  }

  @Test
  func `converts from hwb() with alpha`() throws {
    let color = try CGColor.convert(from: "hwb(0 0% 0% / 0.5)", appContext: appContext)
    testColorComponentsApprox(color, 255, 0, 0, 127.5)
  }

  @Test
  func `normalizes hwb() when whiteness plus blackness exceeds 100 percent`() throws {
    // w=80%, b=80% → sum > 1 → normalized to w=0.5, b=0.5 → gray
    let color = try CGColor.convert(from: "hwb(0 80% 80%)", appContext: appContext)
    testColorComponentsApprox(color, 127.5, 127.5, 127.5, 255)
  }

  // MARK: - Error Cases

  @Test
  func `throws when hex string is invalid`() {
    let invalidHexStrings = ["", "#21", "ABCDEFGH", "1122334455", "XYZ", "!@#$%"]

    for hex in invalidHexStrings {
      #expect {
        try CGColor.convert(from: hex, appContext: appContext)
      } throws: { error in
        guard let hexError = error as? InvalidHexColorException else {
          return false
        }
        return hexError.description == InvalidHexColorException(hex).description
      }
    }
  }

  @Test
  func `throws when int overflows`() {
    let hex = 0xB_BAA8_8FF2
    #expect {
      try CGColor.convert(from: hex, appContext: appContext)
    } throws: { error in
      guard let overflowError = error as? HexColorOverflowException else {
        return false
      }
      return overflowError.description == HexColorOverflowException(UInt64(hex)).description
    }
  }

  @Test
  func `throws for invalid rgb string`() {
    #expect(throws: InvalidRGBColorException.self) {
      try CGColor.convert(from: "rgb(invalid)", appContext: appContext)
    }
  }

  @Test
  func `throws for invalid hsl string`() {
    #expect(throws: InvalidHSLColorException.self) {
      try CGColor.convert(from: "hsl(invalid)", appContext: appContext)
    }
  }

  @Test
  func `throws for invalid hwb string`() {
    #expect(throws: InvalidHWBColorException.self) {
      try CGColor.convert(from: "hwb(invalid)", appContext: appContext)
    }
  }

  @Test
  func `throws when color components array has fewer than 3 values`() {
    let shortArrays: [[Double]] = [[], [1.0], [1.0, 0.5]]

    for components in shortArrays {
      #expect {
        try CGColor.convert(from: components, appContext: appContext)
      } throws: { error in
        guard let componentsError = error as? InvalidColorComponentsException else {
          return false
        }
        return componentsError.description == InvalidColorComponentsException(components.count).description
      }
    }
  }
}
