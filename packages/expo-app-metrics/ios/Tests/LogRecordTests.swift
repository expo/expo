import Foundation
import Testing

@testable import ExpoAppMetrics

@Suite("LogRecord")
struct LogRecordTests {
  @Test
  func `default timestamp includes milliseconds`() throws {
    let timestamp = LogRecord(name: "event").timestamp

    #expect(timestamp.range(of: #"\.\d{3}Z$"#, options: .regularExpression) != nil)
    _ = try Date.ISO8601FormatStyle().parse(timestamp)
  }
}
