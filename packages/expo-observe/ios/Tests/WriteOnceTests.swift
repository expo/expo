import Testing

@testable import ExpoObserve

// `AppMetrics.host` is process-wide and set once, so the write-once rule is tested on its own
// instances instead.
@Suite("WriteOnce")
struct WriteOnceTests {
  @Test
  func `returns the set value`() {
    let value = WriteOnce("initial")
    #expect(value.set("configured"))
    #expect(value.value == "configured")
  }

  @Test
  func `ignores a second set`() {
    let value = WriteOnce("initial")
    #expect(value.set("first"))
    #expect(!value.set("second"))
    #expect(value.value == "first")
  }

  @Test
  func `a read before the set does not block the set`() {
    let value = WriteOnce("initial")
    #expect(value.value == "initial")
    #expect(value.set("late"))
    #expect(value.value == "late")
  }
}
