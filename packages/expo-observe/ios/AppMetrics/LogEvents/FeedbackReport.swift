// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

let feedbackLogName = "expo.feedback"

/// User feedback from `Observe.reportFeedback`. The JS layer validates it and adds the scale to every rating.
struct FeedbackReport {
  var id: String = ""
  var message: String?
  var rating: Int?
  var scale: FeedbackScale?
  var attributes: [String: Any]?

  func toLogRecord() -> LogRecord {
    let sanitized = sanitizeLogEventAttributes(attributes, source: "reportFeedback")
    // Added after sanitization, so caller attributes cannot replace them.
    var attributes = sanitized.attributes ?? [:]
    attributes["expo.feedback.id"] = id
    if let rating {
      attributes["expo.feedback.rating"] = rating
    }
    if let scale {
      attributes["expo.feedback.scale.min"] = scale.min
      attributes["expo.feedback.scale.max"] = scale.max
    }
    return LogRecord(
      name: feedbackLogName,
      body: validateEventBody(message, source: "reportFeedback"),
      attributes: attributes,
      droppedAttributesCount: sanitized.droppedCount
    )
  }
}

struct FeedbackScale {
  var min: Int = 0
  var max: Int = 0
}
