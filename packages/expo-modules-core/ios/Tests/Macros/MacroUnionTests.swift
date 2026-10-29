// Copyright 2026-present 650 Industries. All rights reserved.

import Testing
import ExpoModulesJSI

@testable import ExpoModulesCore

// MARK: - Test types

@Record
private struct UnionSourceOptions: Equatable {
  var url: String = ""
  var retries: Int = 0
}

// A union of a primitive and a record. The string case comes first, so a JS string decodes as
// `.text` and an object as `.options`.
@Union
private enum UnionSource: Equatable {
  case text(String)
  case options(UnionSourceOptions)
}

// Covers a labeled associated value.
@Union
private enum UnionLabeled: Equatable {
  case integer(value: Int)
  case text(String)
}

@ExpoModule
private final class MacroUnionModule: Module {
  @JS
  func describe(source: UnionSource) -> String {
    switch source {
    case .text(let text):
      return "text:\(text)"
    case .options(let options):
      return "options:\(options.url):\(options.retries)"
    }
  }

  @JS
  func echo(source: UnionSource) -> UnionSource {
    return source
  }

  @JS
  func fromText(text: String) -> UnionSource {
    return .text(text)
  }

  @JS
  func fromOptions(url: String) -> UnionSource {
    return .options(UnionSourceOptions(url: url, retries: 1))
  }
}

@Suite("Macro union")
@JavaScriptActor
private struct MacroUnionTests {
  let appContext: AppContext
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() {
    appContext = AppContext.create()
    appContext.moduleRegistry.register(module: MacroUnionModule(appContext: appContext), name: nil)
  }

  // MARK: - Decoding

  @Test
  func `decodes the first case whose payload matches`() throws {
    let runtime = try runtime
    let value = try runtime.eval("'hello'")
    #expect(try UnionSource.decode(value, in: runtime) == .text("hello"))
  }

  @Test
  func `decodes a later case when the earlier ones do not match`() throws {
    let runtime = try runtime
    let value = try runtime.eval("({ url: 'https://expo.dev', retries: 3 })")
    #expect(try UnionSource.decode(value, in: runtime) == .options(UnionSourceOptions(url: "https://expo.dev", retries: 3)))
  }

  @Test
  func `decodes into a case with a labeled associated value`() throws {
    let runtime = try runtime
    #expect(try UnionLabeled.decode(runtime.eval("7"), in: runtime) == .integer(value: 7))
    #expect(try UnionLabeled.decode(runtime.eval("'7'"), in: runtime) == .text("7"))
  }

  @Test
  func `decodes a union nested in an array and an optional`() throws {
    let runtime = try runtime
    let array = try [UnionSource].decode(runtime.eval("['a', { url: 'b' }]"), in: runtime)
    #expect(array == [.text("a"), .options(UnionSourceOptions(url: "b", retries: 0))])
    #expect(try Optional<UnionSource>.decode(runtime.eval("null"), in: runtime) == nil)
  }

  @Test
  func `throws UnionCaseMismatch when no case matches`() throws {
    let runtime = try runtime
    let value = try runtime.eval("42")
    let error = #expect(throws: Exceptions.UnionCaseMismatch.self) {
      _ = try UnionSource.decode(value, in: runtime)
    }
    #expect(error?.param.unionName == "UnionSource")
    #expect(error?.param.received == "number")
    #expect(error?.param.expected == ["String", "UnionSourceOptions"])
    #expect(error?.reason == "'UnionSource' expected String or UnionSourceOptions, but received number")
  }

  // MARK: - Encoding

  @Test
  func `encodes each case through its payload type`() throws {
    let runtime = try runtime
    let text = try UnionSource.encode(.text("hello"), in: runtime)
    #expect(text.getString() == "hello")

    let options = try UnionSource.encode(.options(UnionSourceOptions(url: "u", retries: 2)), in: runtime)
    let object = options.getObject()
    #expect(object.getProperty("url").getString() == "u")
    #expect(object.getProperty("retries").getInt() == 2)
  }

  // MARK: - Typed accessors

  @Test
  func `as(_:) unwraps the held payload by type`() throws {
    let source = UnionSource.options(UnionSourceOptions(url: "u", retries: 0))
    #expect(try source.as(UnionSourceOptions.self) == UnionSourceOptions(url: "u", retries: 0))
    #expect((try? source.as(String.self)) == nil)
  }

  @Test
  func `as(_:) throws UnionCaseMismatch for a different case`() throws {
    let source = UnionSource.text("hello")
    let error = #expect(throws: Exceptions.UnionCaseMismatch.self) {
      _ = try source.as(UnionSourceOptions.self)
    }
    #expect(error?.param.received == "String")
    #expect(error?.param.expected == ["UnionSourceOptions"])
  }

  // MARK: - Across the @JS boundary

  @Test
  func `decodes a union argument of a @JS function`() throws {
    #expect(try runtime.eval("expo.modules.MacroUnionModule.describe('hi')").asString() == "text:hi")
    #expect(try runtime.eval("expo.modules.MacroUnionModule.describe({ url: 'u', retries: 2 })").asString() == "options:u:2")
  }

  @Test
  func `encodes a union return value of a @JS function`() throws {
    #expect(try runtime.eval("expo.modules.MacroUnionModule.fromText('hi')").asString() == "hi")
    let object = try runtime.eval("expo.modules.MacroUnionModule.fromOptions('u')").asObject()
    #expect(try object.getProperty("url").asString() == "u")
    #expect(try object.getProperty("retries").asInt() == 1)
  }

  @Test
  func `round-trips a union through a @JS function`() throws {
    #expect(try runtime.eval("expo.modules.MacroUnionModule.echo('hi')").asString() == "hi")
    #expect(try runtime.eval("expo.modules.MacroUnionModule.echo({ url: 'u' }).url").asString() == "u")
  }

  @Test
  func `a mismatched union argument surfaces a coded JS error`() throws {
    let message = try runtime.eval(
      """
      try { expo.modules.MacroUnionModule.describe(42); '' } catch (error) { error.message }
      """)
    #expect(try message.asString().contains("'UnionSource' expected String or UnionSourceOptions, but received number"))
  }
}
