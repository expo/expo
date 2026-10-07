import ExpoModulesJSI
import Testing

private final class CachedBox {
  let value: Int

  init(_ value: Int) {
    self.value = value
  }
}

@Suite
@JavaScriptActor
struct JavaScriptRuntimeCacheTests {
  let runtime = JavaScriptRuntime()

  @Test
  func `creates the value on first use and reuses it afterwards`() {
    let key = JavaScriptRuntime.Cache.Key<CachedBox>()
    var makeCount = 0

    let first = runtime.cached(key) {
      makeCount += 1
      return CachedBox(1)
    }
    let second = runtime.cached(key) {
      makeCount += 1
      return CachedBox(2)
    }

    #expect(makeCount == 1)
    #expect(first === second)
    #expect(second.value == 1)
  }

  @Test
  func `keys are independent`() {
    let firstKey = JavaScriptRuntime.Cache.Key<CachedBox>()
    let secondKey = JavaScriptRuntime.Cache.Key<CachedBox>()

    #expect(runtime.cached(firstKey) { CachedBox(1) }.value == 1)
    #expect(runtime.cached(secondKey) { CachedBox(2) }.value == 2)
    #expect(runtime.cached(firstKey) { CachedBox(3) }.value == 1)
  }

  @Test
  func `keys can be used in any order`() {
    let keys = (0..<16).map { _ in JavaScriptRuntime.Cache.Key<CachedBox>() }

    // Using the last key first grows the storage past all the others, which must then stay empty.
    #expect(runtime.cached(keys[15]) { CachedBox(15) }.value == 15)
    #expect(runtime.cached(keys[3]) { CachedBox(3) }.value == 3)
    #expect(runtime.cached(keys[15]) { CachedBox(-1) }.value == 15)
    #expect(runtime.cached(keys[0]) { CachedBox(0) }.value == 0)
  }

  @Test
  func `each runtime has its own entries`() {
    let key = JavaScriptRuntime.Cache.Key<CachedBox>()
    let otherRuntime = JavaScriptRuntime()

    #expect(runtime.cached(key) { CachedBox(1) }.value == 1)
    #expect(otherRuntime.cached(key) { CachedBox(2) }.value == 2)
  }

  @Test
  func `a value can be created from other cached values`() {
    let baseKey = JavaScriptRuntime.Cache.Key<CachedBox>()
    let derivedKey = JavaScriptRuntime.Cache.Key<CachedBox>()

    // The nested lookup runs while the outer one is still creating its value.
    let derived = runtime.cached(derivedKey) {
      let base = runtime.cached(baseKey) { CachedBox(20) }
      return CachedBox(base.value + 1)
    }

    #expect(derived.value == 21)
    #expect(runtime.cached(baseKey) { CachedBox(0) }.value == 20)
  }

  @Test
  func `a throwing make caches nothing`() throws {
    struct MakeError: Error {}
    let key = JavaScriptRuntime.Cache.Key<CachedBox>()

    #expect(throws: MakeError.self) {
      try runtime.cached(key) { throw MakeError() }
    }
    #expect(runtime.cached(key) { CachedBox(1) }.value == 1)
  }

  @Test
  func `caches JavaScript values`() throws {
    let key = JavaScriptRuntime.Cache.Key<JavaScriptValue>()

    let first = try runtime.cached(key) { try runtime.eval("({ answer: 42 })") }
    let second = try runtime.cached(key) { try runtime.eval("({ answer: 0 })") }

    #expect(first === second)
    #expect(second.getObject().getProperty("answer").getInt() == 42)
  }

  @Test
  func `cached values are released with the runtime`() {
    let key = JavaScriptRuntime.Cache.Key<CachedBox>()
    weak var cachedValue: CachedBox?

    do {
      let runtime = JavaScriptRuntime()
      cachedValue = runtime.cached(key) { CachedBox(1) }
      #expect(cachedValue != nil)
      withExtendedLifetime(runtime) {}
    }

    #expect(cachedValue == nil)
  }
}
