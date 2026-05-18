import Testing

@testable import ExpoAppMetrics

@Suite("sanitizeLogEventAttributes")
struct AttributeValidationTests {
  @Test
  func `returns nil when input is nil`() {
    let result = sanitizeLogEventAttributes(nil)
    #expect(result.attributes == nil)
    #expect(result.droppedCount == 0)
  }

  @Test
  func `passes through normal attributes unchanged`() {
    let result = sanitizeLogEventAttributes(["userId": "u_42", "attempt": 2])
    #expect(result.droppedCount == 0)
    let attributes = try! #require(result.attributes)
    #expect(attributes.count == 2)
    #expect(attributes["userId"] as? String == "u_42")
    #expect(attributes["attempt"] as? Int == 2)
  }

  @Test
  func `trims whitespace from valid keys`() {
    let result = sanitizeLogEventAttributes(["  userId  ": "u_42"])
    #expect(result.droppedCount == 0)
    let attributes = try! #require(result.attributes)
    #expect(attributes["userId"] as? String == "u_42")
    #expect(attributes["  userId  "] == nil)
  }

  @Test
  func `drops empty and whitespace-only keys`() {
    let result = sanitizeLogEventAttributes([
      "": "x",
      "   ": "y",
      "valid": "z"
    ])
    #expect(result.droppedCount == 2)
    let attributes = try! #require(result.attributes)
    #expect(attributes.count == 1)
    #expect(attributes["valid"] as? String == "z")
  }

  @Test
  func `drops keys under the reserved expo namespace`() {
    let result = sanitizeLogEventAttributes([
      "expo.app.name": "spoofed",
      "expo.eas_client.id": "spoofed",
      "userId": "u_42"
    ])
    #expect(result.droppedCount == 2)
    let attributes = try! #require(result.attributes)
    #expect(attributes.count == 1)
    #expect(attributes["userId"] as? String == "u_42")
  }

  @Test
  func `drops SDK-set OTel keys (event.name, session.id)`() {
    let result = sanitizeLogEventAttributes([
      "event.name": "spoofed",
      "session.id": "spoofed",
      "ok": true
    ])
    #expect(result.droppedCount == 2)
    let attributes = try! #require(result.attributes)
    #expect(attributes.count == 1)
    #expect(attributes["ok"] as? Bool == true)
  }

  @Test
  func `applies reserved-prefix check after trimming whitespace`() {
    let result = sanitizeLogEventAttributes(["  expo.foo  ": "x"])
    #expect(result.droppedCount == 1)
    #expect(result.attributes == nil)
  }

  @Test
  func `applies SDK-set check after trimming whitespace`() {
    let result = sanitizeLogEventAttributes(["  event.name  ": "x"])
    #expect(result.droppedCount == 1)
    #expect(result.attributes == nil)
  }

  @Test
  func `does not match keys that merely start with a reserved word but aren't the namespace`() {
    let result = sanitizeLogEventAttributes([
      "expoFoo": "ok",
      "expo": "ok",
      "session.idx": "ok",
      "event.name.extra": "ok"
    ])
    #expect(result.droppedCount == 0)
    let attributes = try! #require(result.attributes)
    #expect(attributes.count == 4)
  }

  @Test
  func `caps attributes at 128 entries and reports the overflow`() {
    var input: [String: Any] = [:]
    for i in 0..<200 {
      // Pad keys so sort order is deterministic and predictable.
      input[String(format: "k%03d", i)] = i
    }
    let result = sanitizeLogEventAttributes(input)
    #expect(result.droppedCount == 72)
    let attributes = try! #require(result.attributes)
    #expect(attributes.count == 128)
    // Sorted-ascending kept set means the first 128 keys (k000…k127) survive.
    #expect(attributes["k000"] as? Int == 0)
    #expect(attributes["k127"] as? Int == 127)
    #expect(attributes["k128"] == nil)
  }

  @Test
  func `returns nil attributes when every entry is dropped`() {
    let result = sanitizeLogEventAttributes([
      "expo.foo": "x",
      "expo.bar": "y"
    ])
    #expect(result.attributes == nil)
    #expect(result.droppedCount == 2)
  }

  @Test
  func `combines multiple drop categories in the count`() {
    let result = sanitizeLogEventAttributes([
      "": "empty-key-drop",
      "expo.foo": "namespace-drop",
      "session.id": "sdk-drop",
      "valid": "ok"
    ])
    #expect(result.droppedCount == 3)
    let attributes = try! #require(result.attributes)
    #expect(attributes.count == 1)
    #expect(attributes["valid"] as? String == "ok")
  }
}
