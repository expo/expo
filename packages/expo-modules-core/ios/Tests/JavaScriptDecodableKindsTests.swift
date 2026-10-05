// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

@testable import ExpoModulesCore

/// `decodableKinds` of the core types. A kind outside the set must be definitive, because a union
/// skips the case without trying to decode it.
@Suite("JavaScriptDecodable.decodableKinds in core")
@JavaScriptActor
struct JavaScriptDecodableKindsTests {
  let appContext = AppContext.create()

  static let samples = [
    "42", "1.5", "'text'", "true", "null", "undefined", "10n", "Symbol()", "({})", "[1]", "new Uint8Array(1)",
    "(function () {})",
  ]
  static let objects: Set<String> = ["({})", "[1]", "new Uint8Array(1)", "(function () {})"]

  private func expectDecodableKinds<T: JavaScriptDecodable>(
    _ type: T.Type,
    accept accepted: Set<String>,
    sourceLocation: SourceLocation = #_sourceLocation
  ) throws {
    let runtime = try appContext.runtime
    for source in Self.samples {
      let value = try runtime.eval(source)
      let expected = accepted.contains(source)
      #expect(
        T.decodableKinds.contains(JavaScriptValueKinds(of: value)) == expected,
        "\(source)",
        sourceLocation: sourceLocation
      )
      if !expected {
        #expect(throws: (any Error).self, "decode \(source)", sourceLocation: sourceLocation) {
          _ = try T.decode(value, in: runtime)
        }
      }
    }
  }

  @Test
  func `ArrayBuffer accepts only objects`() throws {
    try expectDecodableKinds(ArrayBuffer.self, accept: Self.objects)
  }

  @Test
  func `typed arrays accept only objects`() throws {
    try expectDecodableKinds(Uint8Array.self, accept: Self.objects)
  }

  @Test
  func `records accept only objects`() throws {
    try expectDecodableKinds(CodablePoint.self, accept: Self.objects)
  }

  @Test
  func `shared objects accept only objects`() throws {
    try expectDecodableKinds(DecodableKindsSharedObject.self, accept: Self.objects)
  }

  @Test
  func `enums accept what their raw value accepts`() throws {
    try expectDecodableKinds(DecodableKindsStringEnum.self, accept: ["'text'"])
    try expectDecodableKinds(DecodableKindsIntEnum.self, accept: ["42", "1.5", "10n"])
  }
}

private final class DecodableKindsSharedObject: SharedObject {}

private enum DecodableKindsStringEnum: String, Enumerable {
  case text
}

private enum DecodableKindsIntEnum: Int, Enumerable {
  case answer = 42
}
