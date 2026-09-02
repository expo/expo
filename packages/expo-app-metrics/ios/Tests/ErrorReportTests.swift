// Copyright 2025-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoAppMetrics

@Suite("ErrorReport")
struct ErrorReportTests {
  @Test
  func `includes the component stack attribute when present`() {
    let report = ErrorReport(
      source: .errorBoundary,
      type: "Error",
      message: "boom",
      stacktrace: "at f (app.js:1:1)",
      componentStack: "at Boom (App.tsx:1:1)",
      isFatal: false
    )

    let attributes = try! #require(report.toLogRecord().attributes?.value as? [String: Any])
    #expect(attributes["expo.error.component_stack"] as? String == "at Boom (App.tsx:1:1)")
    #expect(attributes["expo.error.source"] as? String == "errorBoundary")
  }

  @Test
  func `omits the component stack attribute when absent`() {
    let report = ErrorReport(
      source: .global,
      type: "Error",
      message: "boom",
      stacktrace: "at f (app.js:1:1)",
      componentStack: nil,
      isFatal: false
    )

    let attributes = try! #require(report.toLogRecord().attributes?.value as? [String: Any])
    #expect(attributes.keys.contains("expo.error.component_stack") == false)
  }

  @Test
  func `tags a user-reported error with the reportedByUser source at error severity`() {
    let report = ErrorReport(
      source: .reportedByUser,
      type: "TypeError",
      message: "nope",
      stacktrace: "at f (app.js:1:1)",
      isFatal: false
    )
    let record = report.toLogRecord()
    let attributes = try! #require(record.attributes?.value as? [String: Any])
    #expect(attributes["expo.error.source"] as? String == "reportedByUser")
    #expect(attributes["expo.error.is_fatal"] as? Bool == false)
    #expect(record.severity == .error)
  }
}
