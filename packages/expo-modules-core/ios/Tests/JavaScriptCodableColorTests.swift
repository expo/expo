// Copyright 2026-present 650 Industries. All rights reserved.

import SwiftUI
import Testing
import ExpoModulesJSI

@testable import ExpoModulesCore

@Record
private struct CodableColorsRecord {
  var color: UIColor
  var cgColor: CGColor?
  var swiftUIColor: Color?
}

@ExpoModule
private final class CodableColorModule: Module {
  @JS
  func echo(color: UIColor) -> UIColor {
    return color
  }

  @JS
  func echoCGColor(color: CGColor) -> CGColor {
    return color
  }

  @JS
  func echoSwiftUIColor(color: Color) -> Color {
    return color
  }

  @JS
  func primarySwiftUIColor() -> Color {
    return .primary
  }

  @JS
  func passthrough(record: CodableColorsRecord) -> CodableColorsRecord {
    return record
  }
}

@Suite("JavaScriptCodable+Color")
@JavaScriptActor
private struct JavaScriptCodableColorTests {
  let appContext: AppContext

  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() {
    appContext = AppContext.create()
    appContext.moduleRegistry.register(module: CodableColorModule(appContext: appContext), name: nil)
  }

  // Each input takes a different branch of the `Convertible` conversion.
  nonisolated static let validInputs = [
    "'red'",
    "'transparent'",
    "'#2A4B5D'",
    "'#f00a'",
    "'rgba(255, 0, 0, 0.5)'",
    "'hsl(120 100% 50% / 25%)'",
    "'hwb(240 0% 0%)'",
    "0x80ff0000",
    "[0.2, 0.4, 0.6]",
    "[0.2, 0.4, 0.6, 0.8]",
    "({ semantic: 'systemRed' })",
    "({ semantic: ['notAColor', 'systemBlue'] })",
    "({ dynamic: { light: 'red', dark: 'blue' } })",
  ]

  // MARK: - UIColor

  @Test(arguments: validInputs)
  func `decodes UIColor like the Convertible conversion`(input: String) throws {
    let runtime = try runtime
    let expected = try UIColor.convert(from: runtime.eval(input).getAny()).string

    #expect(try UIColor.decode(runtime.eval(input), in: runtime).string == expected)
    #expect(try runtime.eval("expo.modules.CodableColorModule.echo(\(input))").asString() == expected)
  }

  @Test
  func `encodes UIColor as a hex string`() throws {
    let runtime = try runtime
    let encoded = try UIColor.encode(UIColor(red: 1, green: 0, blue: 0, alpha: 0.5), in: runtime)

    #expect(try encoded.asString() == "#ff000080")
  }

  // MARK: - CGColor

  @Test(arguments: validInputs)
  func `decodes CGColor like the Convertible conversion`(input: String) throws {
    let runtime = try runtime
    let expected = try CGColor.convert(from: runtime.eval(input).getAny(), appContext: appContext)

    #expect(try CGColor.decode(runtime.eval(input), in: runtime).components == expected.components)
    #expect(
      try runtime.eval("expo.modules.CodableColorModule.echoCGColor(\(input))").asString()
        == UIColor(cgColor: expected).string
    )
  }

  @Test
  func `encodes CGColor as a hex string`() throws {
    let runtime = try runtime
    let encoded = try CGColor.encode(UIColor(red: 0, green: 1, blue: 0, alpha: 1).cgColor, in: runtime)

    #expect(try encoded.asString() == "#00ff00ff")
  }

  // MARK: - SwiftUI Color

  @Test(arguments: validInputs + ["'primary'", "'mint'", "'clear'"])
  func `decodes SwiftUI Color like the Convertible conversion`(input: String) throws {
    let runtime = try runtime
    let expected = try UIColor(Color.convert(from: runtime.eval(input).getAny())).string

    #expect(try UIColor(Color.decode(runtime.eval(input), in: runtime)).string == expected)
    #expect(try runtime.eval("expo.modules.CodableColorModule.echoSwiftUIColor(\(input))").asString() == expected)
  }

  @Test
  func `encodes SwiftUI Color as a hex string`() throws {
    let runtime = try runtime

    #expect(try runtime.eval("expo.modules.CodableColorModule.echoSwiftUIColor('#2A4B5D')").asString() == "#2a4b5dff")
    #expect(try Color.encode(Color(red: 0, green: 0, blue: 1), in: runtime).asString() == "#0000ffff")
  }

  @Test
  func `encodes a dynamic SwiftUI Color as a hex string`() throws {
    let encoded = try runtime.eval("expo.modules.CodableColorModule.primarySwiftUIColor()").asString()

    #expect(encoded.wholeMatch(of: /#[0-9a-f]{8}/) != nil)
  }

  // MARK: - Records

  @Test
  func `decodes and encodes @Record fields`() throws {
    let runtime = try runtime
    try runtime.eval(
      "result = expo.modules.CodableColorModule.passthrough({ color: 'red', cgColor: [0, 0, 1], swiftUIColor: '#00ff00' })"
    )

    #expect(try runtime.eval("result.color").asString() == "#ff0000ff")
    #expect(try runtime.eval("result.cgColor").asString() == "#0000ffff")
    #expect(try runtime.eval("result.swiftUIColor").asString() == "#00ff00ff")
  }

  @Test
  func `encodes omitted optional @Record fields as null`() throws {
    let runtime = try runtime
    try runtime.eval("result = expo.modules.CodableColorModule.passthrough({ color: 'red' })")

    #expect(try runtime.eval("result.cgColor").isNull() == true)
    #expect(try runtime.eval("result.swiftUIColor").isNull() == true)
  }

  // MARK: - Either

  @Test
  func `decodes an Either that holds a UIColor`() throws {
    let runtime = try runtime
    let decoded = try Either<Int, UIColor>.decode(runtime.eval("'blue'"), in: runtime)
    let color: UIColor? = decoded.get()

    #expect(color?.string == "#0000ffff")
  }

  // MARK: - Errors

  nonisolated static let invalidInputs = [
    "'#zzzzzz'",
    "'rgb(1, 2)'",
    "'hsl(1, 2, 3)'",
    "'hwb(1 2 3)'",
    "0x1ffffffff",
    "[0.2, 0.4]",
    "true",
    "({ semantic: 'notAColor' })",
  ]

  @Test(arguments: invalidInputs)
  func `throws the Convertible exception for an invalid UIColor`(input: String) throws {
    let runtime = try runtime
    let expected = try #require(legacyError { try UIColor.convert(from: runtime.eval(input).getAny()) })
    let actual = try #require(legacyError { try UIColor.decode(runtime.eval(input), in: runtime) })

    #expect(actual.code == expected.code)
    #expect(actual.reason == expected.reason)
    try expectJavaScriptError(calling: "echo", with: input, matches: expected)
  }

  @Test(arguments: invalidInputs)
  func `throws the Convertible exception for an invalid CGColor`(input: String) throws {
    let runtime = try runtime
    let expected = try #require(legacyError { try CGColor.convert(from: runtime.eval(input).getAny(), appContext: appContext) })
    let actual = try #require(legacyError { try CGColor.decode(runtime.eval(input), in: runtime) })

    #expect(actual.code == expected.code)
    #expect(actual.reason == expected.reason)
    try expectJavaScriptError(calling: "echoCGColor", with: input, matches: expected)
  }

  @Test(arguments: invalidInputs)
  func `throws the Convertible exception for an invalid SwiftUI Color`(input: String) throws {
    let runtime = try runtime
    let expected = try #require(legacyError { try Color.convert(from: runtime.eval(input).getAny()) })
    let actual = try #require(legacyError { try Color.decode(runtime.eval(input), in: runtime) })

    #expect(actual.code == expected.code)
    #expect(actual.reason == expected.reason)
    try expectJavaScriptError(calling: "echoSwiftUIColor", with: input, matches: expected)
  }

  // MARK: - Helpers

  /// The code and reason of the exception that `body` throws, or `nil` when it doesn't throw.
  private func legacyError(_ body: () throws -> Any) -> (code: String, reason: String)? {
    do {
      _ = try body()
    } catch let error as Exception {
      return (error.code, error.reason)
    } catch {
      Issue.record("Unexpected error: \(error)")
    }
    return nil
  }

  /// Calls the `@JS` function with the argument and checks that the JavaScript error carries the code and
  /// reason of the `Convertible` conversion.
  private func expectJavaScriptError(
    calling function: String,
    with argument: String,
    matches expected: (code: String, reason: String)
  ) throws {
    let runtime = try runtime
    let error = try runtime.eval(
      """
      (() => {
        try {
          expo.modules.CodableColorModule.\(function)(\(argument))
          return null
        } catch (error) {
          return { code: error.code, message: error.message }
        }
      })()
      """
    )
    .asObject()

    #expect(try error.getProperty("code").asString() == expected.code)
    #expect(try error.getProperty("message").asString().contains(expected.reason))
  }
}
