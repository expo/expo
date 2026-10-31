import ExpoModulesJSI
import Testing

@Suite
@JavaScriptActor
struct JavaScriptSymbolTests {
  let runtime = JavaScriptRuntime()

  // MARK: - Creation

  @Test
  func `create with a description`() throws {
    let symbol = try JavaScriptSymbol(runtime, description: "tag")
    #expect(symbol.toString() == "Symbol(tag)")
  }

  @Test
  func `create without a description`() throws {
    let symbol = try JavaScriptSymbol(runtime)
    #expect(symbol.toString() == "Symbol()")
  }

  @Test
  func `created symbols are unique`() throws {
    let first = try JavaScriptSymbol(runtime, description: "tag")
    let second = try JavaScriptSymbol(runtime, description: "tag")
    #expect((first == second) == false)
  }

  @Test
  func `for returns the registered symbol`() throws {
    let symbol = try JavaScriptSymbol.for(runtime, "expo.tag")
    let registered = try runtime.eval("Symbol.for('expo.tag')").asSymbol()
    #expect((symbol == registered) == true)
  }

  // MARK: - Well-known symbols

  @Test(arguments: [
    (JavaScriptSymbol.WellKnown.asyncIterator, "asyncIterator"),
    (.hasInstance, "hasInstance"),
    (.isConcatSpreadable, "isConcatSpreadable"),
    (.iterator, "iterator"),
    (.match, "match"),
    (.matchAll, "matchAll"),
    (.replace, "replace"),
    (.search, "search"),
    (.split, "split"),
    (.toPrimitive, "toPrimitive"),
    (.toStringTag, "toStringTag"),
  ])
  func `wellKnown returns the global symbol`(wellKnown: JavaScriptSymbol.WellKnown, name: String) throws {
    let symbol = try JavaScriptSymbol.wellKnown(runtime, wellKnown)
    let global = try runtime.eval("Symbol.\(name)").asSymbol()
    #expect((symbol == global) == true)
  }

  @Test
  func `wellKnown returns the same symbol on each call`() throws {
    let first = try JavaScriptSymbol.wellKnown(runtime, .toStringTag)
    let second = try JavaScriptSymbol.wellKnown(runtime, .toStringTag)
    #expect((first == second) == true)
  }

  // MARK: - Values

  @Test
  func `getSymbol reads a symbol value`() throws {
    let value = try runtime.eval("Symbol('tag')")
    #expect(value.isSymbol() == true)
    #expect(value.getSymbol().toString() == "Symbol(tag)")
  }

  @Test
  func `asSymbol throws for a value that is not a symbol`() throws {
    let value = try runtime.eval("'Symbol(tag)'")
    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try value.asSymbol()
    }
  }

  @Test
  func `asValue round-trips the symbol`() throws {
    let symbol = try JavaScriptSymbol(runtime, description: "tag")
    let value = symbol.asValue()
    #expect(value.kind == .symbol)
    #expect((value.getSymbol() == symbol) == true)
  }

  @Test
  func `unowned getSymbol reads the borrowed symbol`() throws {
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: try runtime.eval("Symbol.iterator").ref())
    let symbol = buffer.unownedValue(at: 0).getSymbol(in: runtime)
    #expect((symbol == (try JavaScriptSymbol.wellKnown(runtime, .iterator))) == true)
  }

  // MARK: - Property keys

  @Test
  func `symbol property key sets and gets a property`() throws {
    let object = runtime.createObject()
    let key = JavaScriptPropNameID(runtime, symbol: try JavaScriptSymbol.wellKnown(runtime, .toStringTag))
    object.setProperty(key, value: JavaScriptValue(runtime, "Tagged"))

    #expect(object.getProperty(key).getString() == "Tagged")

    let toString = try runtime.eval("(function () { return Object.prototype.toString.call(this) })").asFunction()
    #expect(try toString.call(this: object).asString() == "[object Tagged]")
  }
}
