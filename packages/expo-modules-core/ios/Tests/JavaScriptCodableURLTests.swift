// Copyright 2026-present 650 Industries. All rights reserved.

import Testing
import ExpoModulesJSI

@testable import ExpoModulesCore

@Record
private struct CodableURLRecord {
  var url: URL
  var fallbackUrl: URL?
}

@ExpoModule
private final class CodableURLModule: Module {
  @JS
  func echo(url: URL) -> URL {
    return url
  }

  @JS
  func absoluteString(url: URL) -> String {
    return url.absoluteString
  }

  @JS
  func passthrough(record: CodableURLRecord) -> CodableURLRecord {
    return record
  }

  @JS
  func describeEither(value: Either<URL, Int>) -> String {
    if let url: URL = value.get() {
      return "url:\(url.absoluteString)"
    }
    if let number: Int = value.get() {
      return "int:\(number)"
    }
    return "none"
  }
}

@Suite("JavaScriptCodable+URL")
@JavaScriptActor
private struct JavaScriptCodableURLTests {
  let appContext: AppContext

  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() {
    appContext = AppContext.create()
    appContext.moduleRegistry.register(module: CodableURLModule(appContext: appContext), name: nil)
    appContext.moduleRegistry.register(
      holder: mockModuleHolder(appContext) {
        Name("LegacyURLModule")

        Function("absoluteString") { (url: URL) -> String in
          return url.absoluteString
        }
      })
  }

  // MARK: - Decoding

  // Each input takes a different branch of the `Convertible` conversion: a valid URL, a string that needs
  // percent-encoding, a file path, and a file URL.
  nonisolated static let validInputs = [
    "https://expo.dev/?param=%F0%9F%A5%93",
    "https://expo.dev/?param=🥓",
    "https://expo.dev/path with spaces",
    "/var/mobile/Containers/Data/file name.txt",
    "file:///var/mobile/file.txt",
    "relative/path",
  ]

  @Test(arguments: validInputs)
  func `decodes a @JS argument like the Convertible conversion`(input: String) throws {
    let runtime = try runtime
    let expected = try URL.convert(from: input, appContext: appContext).absoluteString
    let literal = try javaScriptLiteral(input)

    #expect(try runtime.eval("expo.modules.CodableURLModule.absoluteString(\(literal))").asString() == expected)
    #expect(try runtime.eval("expo.modules.LegacyURLModule.absoluteString(\(literal))").asString() == expected)
  }

  @Test
  func `decodes from a JavaScript value`() throws {
    let runtime = try runtime
    let url = try URL.decode(runtime.eval("'https://expo.dev/?param=🥓'"), in: runtime)

    #expect(url.absoluteString == "https://expo.dev/?param=%F0%9F%A5%93")
  }

  // MARK: - Encoding

  @Test
  func `encodes a @JS return value as the absolute string`() throws {
    let runtime = try runtime
    let result = try runtime.eval("expo.modules.CodableURLModule.echo('https://expo.dev/?param=🥓')")

    #expect(try result.asString() == "https://expo.dev/?param=%F0%9F%A5%93")
  }

  @Test
  func `encodes a file URL as the absolute string`() throws {
    let runtime = try runtime
    let encoded = try URL.encode(URL(fileURLWithPath: "/tmp/file name.txt"), in: runtime)

    #expect(try encoded.asString() == "file:///tmp/file%20name.txt")
  }

  // MARK: - Records

  @Test
  func `decodes and encodes a @Record field`() throws {
    let runtime = try runtime
    try runtime.eval("result = expo.modules.CodableURLModule.passthrough({ url: 'https://expo.dev/?param=🥓' })")

    #expect(try runtime.eval("result.url").asString() == "https://expo.dev/?param=%F0%9F%A5%93")
    #expect(try runtime.eval("result.fallbackUrl").isNull() == true)
  }

  // MARK: - Either

  @Test
  func `decodes an Either argument that holds a URL`() throws {
    let runtime = try runtime

    #expect(try runtime.eval("expo.modules.CodableURLModule.describeEither('https://expo.dev')").asString() == "url:https://expo.dev")
    #expect(try runtime.eval("expo.modules.CodableURLModule.describeEither(42)").asString() == "int:42")
  }

  // MARK: - Errors

  @Test
  func `throws the Convertible exception for a string with invalid characters`() throws {
    let runtime = try runtime
    let input = "https://exa%mple.com"
    let expected = try legacyError(input)

    #expect(expected.code == "ERR_URL_CONTAINS_INVALID_CHARACTERS")
    #expect(throws: UrlContainsInvalidCharactersException.self) {
      _ = try URL.decode(runtime.eval("'\(input)'"), in: runtime)
    }
    try expectJavaScriptError(calling: "'\(input)'", matches: expected)
  }

  @Test
  func `throws the Convertible exception for a value that isn't a string`() throws {
    let runtime = try runtime
    let expected = try legacyError(42.0)

    #expect(expected.code == "ERR_CONVERTING_FAILED")
    #expect(throws: Conversions.ConvertingException<URL>.self) {
      _ = try URL.decode(runtime.eval("42"), in: runtime)
    }
    try expectJavaScriptError(calling: "42", matches: expected)
  }

  // MARK: - Helpers

  private func javaScriptLiteral(_ string: String) throws -> String {
    return try #require(String(data: JSONEncoder().encode(string), encoding: .utf8))
  }

  /// The code and reason that the `Convertible` conversion throws for the value.
  private func legacyError(_ value: Any) throws -> (code: String, reason: String) {
    do {
      _ = try URL.convert(from: value, appContext: appContext)
    } catch let error as Exception {
      return (error.code, error.reason)
    }
    Issue.record("The Convertible conversion didn't throw")
    return ("", "")
  }

  /// Calls the `@JS` function with the argument and checks that the JavaScript error carries the code and
  /// reason of the `Convertible` conversion.
  private func expectJavaScriptError(calling argument: String, matches expected: (code: String, reason: String)) throws {
    let runtime = try runtime
    let error = try runtime.eval(
      """
      (() => {
        try {
          expo.modules.CodableURLModule.absoluteString(\(argument))
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
