// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

// MARK: - Test types

@Record
private struct MacroSegment {
  var name: String = ""
  var range: (start: Int, end: Int) = (0, 0)
}

@Union
private enum MacroCoordinate {
  case pair((Double, Double))
  case label(String)
}

@ExpoModule
private final class MacroTuples: Module {
  @JS
  func swap(pair: (Int, String)) -> (String, Int) {
    return (pair.1, pair.0)
  }

  @JS
  func scale(point: (x: Double, y: Double), by factor: Double) -> (x: Double, y: Double) {
    return (x: point.x * factor, y: point.y * factor)
  }

  @JS
  func lengths(of ranges: [(name: String, range: (Int, Int))]) -> [String: Int] {
    return Dictionary(uniqueKeysWithValues: ranges.map { ($0.name, $0.range.1 - $0.range.0) })
  }

  @JS
  func roundTrip(_ value: [String: (Int, Int)?]) -> [String: (Int, Int)?] {
    return value
  }

  @JS
  var selection: (start: Int, end: Int)?

  @JS
  func widen(_ segment: MacroSegment) -> MacroSegment {
    return MacroSegment(name: segment.name, range: (segment.range.start - 1, segment.range.end + 1))
  }

  @JS
  func describe(_ coordinate: MacroCoordinate) -> MacroCoordinate {
    switch coordinate {
    case .pair(let pair):
      return .label("\(pair.0),\(pair.1)")
    case .label(let label):
      return .pair((Double(label.count), 0))
    }
  }

  @JS
  func transform(_ point: (Int, Int), with body: ((Int, Int)) throws -> (x: Int, y: Int)) throws -> Int {
    let result = try body(point)
    return result.x * 10 + result.y
  }

  @Event
  var onMoved: ((x: Int, y: Int)) -> Void

  // Type aliases declared in the class body resolve to the tuple types they stand for.
  typealias Span = (start: Int, end: Int)
  typealias Spans = [Span]

  @JS
  func merge(_ spans: Spans) -> Span? {
    guard let first = spans.first else {
      return nil
    }
    return spans.dropFirst().reduce(first) { (min($0.start, $1.start), max($0.end, $1.end)) }
  }
}

// MARK: - Tests

@Suite("Macro tuples")
@JavaScriptActor
private struct MacroTupleTests {
  let appContext: AppContext
  let module: MacroTuples
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() {
    appContext = TestAppContext()
    module = MacroTuples(appContext: appContext)
    appContext.moduleRegistry.register(module: module, name: nil)
  }

  private func json(_ source: String) throws -> String {
    return try runtime.eval("JSON.stringify(\(source))").asString()
  }

  @Test
  func `converts an unlabeled tuple to and from an array`() throws {
    #expect(try json("expo.modules.MacroTuples.swap([1, 'a'])") == #"["a",1]"#)
  }

  @Test
  func `converts a labeled tuple to and from an object`() throws {
    #expect(try json("expo.modules.MacroTuples.scale({ x: 1, y: 2 }, 3)") == #"{"x":3,"y":6}"#)
  }

  @Test
  func `converts an array of labeled tuples holding a tuple`() throws {
    let result = try json("expo.modules.MacroTuples.lengths([{ name: 'a', range: [1, 4] }])")
    #expect(result == #"{"a":3}"#)
  }

  @Test
  func `converts a dictionary of optional tuples`() throws {
    // A Swift dictionary has no order, so the entries are read in a fixed order.
    let result = try json("(({ a, b }) => [a, b])(expo.modules.MacroTuples.roundTrip({ a: [1, 2], b: null }))")
    #expect(result == "[[1,2],null]")
  }

  @Test
  func `gets and sets an optional tuple property`() throws {
    #expect(try json("expo.modules.MacroTuples.selection") == "null")
    try runtime.eval("expo.modules.MacroTuples.selection = { start: 2, end: 5 }")
    #expect(module.selection! == (start: 2, end: 5))
    #expect(try json("expo.modules.MacroTuples.selection") == #"{"start":2,"end":5}"#)
  }

  @Test
  func `converts a record property holding a tuple`() throws {
    let result = try json("expo.modules.MacroTuples.widen({ name: 'a', range: { start: 1, end: 2 } })")
    #expect(result == #"{"name":"a","range":{"start":0,"end":3}}"#)
  }

  @Test
  func `converts a union payload holding a tuple`() throws {
    #expect(try json("expo.modules.MacroTuples.describe([1.5, 2])") == #""1.5,2.0""#)
    #expect(try json("expo.modules.MacroTuples.describe('abc')") == "[3,0]")
  }

  @Test
  func `passes a tuple to a closure argument and decodes its tuple result`() throws {
    let result = try runtime.eval("expo.modules.MacroTuples.transform([1, 2], ([a, b]) => ({ x: b, y: a }))")
    #expect(try result.asInt() == 21)
  }

  @Test
  func `resolves type aliases of tuples declared in the module`() throws {
    #expect(try json("expo.modules.MacroTuples.merge([{ start: 3, end: 4 }, { start: 1, end: 2 }])") == #"{"start":1,"end":4}"#)
    #expect(try json("expo.modules.MacroTuples.merge([])") == "null")
  }

  @Test
  func `emits an event with a tuple payload`() async throws {
    try runtime.eval(
      """
      globalThis.result = null
      expo.modules.MacroTuples.addListener('moved', payload => { globalThis.result = payload.x * 10 + payload.y })
      """)

    module.onMoved((x: 4, y: 2))

    try await expectEventually {
      guard let result = try? await self.runtime.eval("globalThis.result"), result.isNumber() else {
        return false
      }
      return try await result.asInt() == 42
    }
  }
}
