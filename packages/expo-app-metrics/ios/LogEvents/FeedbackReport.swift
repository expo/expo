// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

public let feedbackLogName = "expo.feedback"

/// User feedback from `Observe.reportFeedback`. The JS layer validates `id`, `message`, and `rating`.
struct FeedbackReport: Record {
  @Field var id: String = ""
  @Field var message: String?
  @Field var rating: Int?
  @Field var attributes: [String: Any]?

  func toLogRecord() -> LogRecord {
    let sanitized = sanitizeLogEventAttributes(attributes, source: "reportFeedback")
    // Added after sanitization, so caller attributes cannot replace them.
    var attributes = sanitized.attributes ?? [:]
    attributes["expo.feedback.id"] = id
    if let rating {
      attributes["expo.feedback.rating"] = rating
    }
    return LogRecord(
      name: feedbackLogName,
      body: validateEventBody(message, source: "reportFeedback"),
      attributes: attributes,
      droppedAttributesCount: sanitized.droppedCount
    )
  }
}
