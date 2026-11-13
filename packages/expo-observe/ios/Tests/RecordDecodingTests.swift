// Copyright 2025-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore
@testable import ExpoObserve

@Suite("JS records")
@JavaScriptActor
struct RecordDecodingTests {
  let appContext = AppContext.create()

  @Test
  func `an empty error report object decodes to the defaults`() throws {
    let runtime = try appContext.runtime
    let report = try ErrorReportRecord.decode(runtime.eval("({})"), in: runtime).toErrorReport()
    #expect(report.source == .global)
    #expect(report.type == nil)
    #expect(report.message == "")
    #expect(report.stacktrace == nil)
    #expect(report.componentStack == nil)
    #expect(report.isFatal == false)
  }

  @Test
  func `a populated error report object keeps every field`() throws {
    let runtime = try appContext.runtime
    let value = try runtime.eval(
      """
      ({ source: 'errorBoundary', type: 'TypeError', message: 'boom', stacktrace: 'at f',
         componentStack: 'at App', isFatal: true })
      """
    )
    let report = try ErrorReportRecord.decode(value, in: runtime).toErrorReport()
    #expect(report.source == .errorBoundary)
    #expect(report.type == "TypeError")
    #expect(report.message == "boom")
    #expect(report.stacktrace == "at f")
    #expect(report.componentStack == "at App")
    #expect(report.isFatal == true)
  }

  @Test
  func `an unknown error source is rejected`() throws {
    let runtime = try appContext.runtime
    #expect(throws: (any Error).self) {
      try ErrorReportRecord.decode(runtime.eval("({ source: 'somewhere' })"), in: runtime)
    }
  }

  @Test
  func `an empty feedback report object decodes to the defaults`() throws {
    let runtime = try appContext.runtime
    let report = try FeedbackReportRecord.decode(runtime.eval("({})"), in: runtime).toFeedbackReport()
    #expect(report.id == "")
    #expect(report.message == nil)
    #expect(report.rating == nil)
    #expect(report.scale == nil)
    #expect(report.attributes == nil)
  }

  @Test
  func `a populated feedback report object keeps every field`() throws {
    let runtime = try appContext.runtime
    let value = try runtime.eval(
      """
      ({ id: 'checkout', message: 'Great', rating: 4, scale: { min: 1, max: 5 },
         attributes: { plan: 'pro' } })
      """
    )
    let report = try FeedbackReportRecord.decode(value, in: runtime).toFeedbackReport()
    #expect(report.id == "checkout")
    #expect(report.message == "Great")
    #expect(report.rating == 4)
    #expect(report.scale?.min == 1)
    #expect(report.scale?.max == 5)
    #expect(report.attributes?["plan"] as? String == "pro")
  }
}
