// Copyright 2026-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

// MARK: - Test records and modules

// Free-form (`Any`-bearing) properties, one per conversion route: the dedicated `[String: Any]` and
// `[Any]` shapes, the generic path for a nested shape, and a bare `Any`.
@Record
private struct MacroFreeFormRecord {
  var attributes: [String: Any]?
  var items: [Any] = []
  var groups: [String: [Any]?]?
  var value: Any?
}

@ExpoModule
private final class MacroFreeFormRecords: Module {
  // Decodes the argument through `from(object:)` and encodes the return value through `toObject`.
  @JS
  func passthrough(record: MacroFreeFormRecord) -> MacroFreeFormRecord {
    return record
  }

  // Reports the decoded native values, so the test can check them without encoding them back.
  @JS
  func describe(record: MacroFreeFormRecord) -> [String] {
    return [
      String(describing: record.attributes?["count"] as? Double),
      String(describing: record.attributes?.keys.sorted()),
      String(describing: record.items.count),
      String(describing: record.groups?["empty"].map { $0 == nil }),
      String(describing: record.value as? String),
    ]
  }
}

// MARK: - Tests

@Suite("Macro record")
@JavaScriptActor
private struct MacroRecordTests {
  let appContext: AppContext
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() {
    appContext = AppContext.create()
    appContext.moduleRegistry.register(module: MacroFreeFormRecords(appContext: appContext), name: nil)
  }

  // Numbers become `Double`, and a nested `null` becomes `nil`, so it fits the nested optional in
  // `groups`.
  @Test
  func `decodes free-form properties from JavaScript`() throws {
    let description = try runtime.eval(
      "expo.modules.MacroFreeFormRecords.describe({ attributes: { count: 3, name: 'x' }, items: [1, 'two'], groups: { empty: null }, value: 'v' })"
    )
    .getArray()
    .map { try $0.asString() }
    #expect(description == ["Optional(3.0)", #"Optional(["count", "name"])"#, "2", "Optional(true)", #"Optional("v")"#])
  }

  @Test
  func `round-trips free-form properties through JavaScript`() throws {
    try runtime.eval(
      "result = expo.modules.MacroFreeFormRecords.passthrough({ attributes: { a: 1, b: 'x', c: null, d: [true] }, items: [1, 'two'], groups: { g: [1, 2], empty: null }, value: 'v' })"
    )
    let json = try runtime.eval(
      "JSON.stringify([result.attributes.a, result.attributes.b, result.attributes.c, result.attributes.d, result.items, result.groups.g, result.groups.empty, result.value])"
    )
    #expect(try json.asString() == #"[1,"x",null,[true],[1,"two"],[1,2],null,"v"]"#)
  }

  // An omitted optional property encodes as `null`, and an omitted defaulted one as its default.
  @Test
  func `fills omitted free-form properties with nil or their default`() throws {
    try runtime.eval("result = expo.modules.MacroFreeFormRecords.passthrough({})")
    let json = try runtime.eval("JSON.stringify([result.attributes, result.items, result.groups, result.value])")
    #expect(try json.asString() == "[null,[],null,null]")
  }
}
