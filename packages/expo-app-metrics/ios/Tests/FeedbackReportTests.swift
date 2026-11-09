// Copyright 2025-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoAppMetrics

@Suite("FeedbackReport")
struct FeedbackReportTests {
  private func report(
    id: String = "checkout",
    message: String? = nil,
    rating: Int? = nil,
    attributes: [String: Any]? = nil
  ) -> FeedbackReport {
    var report = FeedbackReport()
    report.id = id
    report.message = message
    report.rating = rating
    report.attributes = attributes
    return report
  }

  @Test
  func `records an expo.feedback event with the id, rating, and message`() throws {
    let record = report(message: "Great", rating: 7, attributes: ["plan": "pro"]).toLogRecord()

    let attributes = try #require(record.attributes?.value as? [String: Any])
    #expect(record.name == "expo.feedback")
    #expect(record.body == "Great")
    #expect(record.severity == .info)
    #expect(attributes["expo.feedback.id"] as? String == "checkout")
    #expect(attributes["expo.feedback.rating"] as? Int == 7)
    #expect(attributes["plan"] as? String == "pro")
  }

  @Test
  func `user attributes cannot overwrite the feedback attributes`() throws {
    let record = report(
      rating: 3,
      attributes: ["expo.feedback.id": "spoofed", "expo.feedback.rating": 10]
    ).toLogRecord()

    let attributes = try #require(record.attributes?.value as? [String: Any])
    #expect(attributes["expo.feedback.id"] as? String == "checkout")
    #expect(attributes["expo.feedback.rating"] as? Int == 3)
    #expect(record.droppedAttributesCount == 2)
  }

  @Test
  func `omits the rating attribute when no rating is set`() throws {
    let record = report(message: "Great").toLogRecord()

    let attributes = try #require(record.attributes?.value as? [String: Any])
    #expect(attributes.keys.contains("expo.feedback.rating") == false)
  }

  @Test
  func `cuts the message to 4096 characters`() {
    let record = report(message: String(repeating: "a", count: 5000)).toLogRecord()

    #expect(record.body?.count == 4096)
  }
}
