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
    let report = try JsErrorReport.decode(runtime.eval("({})"), in: runtime).toErrorReport()
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
    let report = try JsErrorReport.decode(value, in: runtime).toErrorReport()
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
      try JsErrorReport.decode(runtime.eval("({ source: 'somewhere' })"), in: runtime)
    }
  }

  @Test
  func `an empty feedback report object decodes to the defaults`() throws {
    let runtime = try appContext.runtime
    let report = try JsFeedbackReport.decode(runtime.eval("({})"), in: runtime).toFeedbackReport()
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
    let report = try JsFeedbackReport.decode(value, in: runtime).toFeedbackReport()
    #expect(report.id == "checkout")
    #expect(report.message == "Great")
    #expect(report.rating == 4)
    #expect(report.scale?.min == 1)
    #expect(report.scale?.max == 5)
    #expect(report.attributes?["plan"] as? String == "pro")
  }

  @Test
  func `an omitted filter field stays nil and an empty one stays empty`() throws {
    let runtime = try appContext.runtime
    let omitted = try JsNetworkRequestFilter.decode(runtime.eval("({})"), in: runtime).toFilter()
    #expect(omitted.hosts == nil)
    #expect(omitted.methods == nil)

    let empty = try JsNetworkRequestFilter.decode(runtime.eval("({ hosts: [], methods: [] })"), in: runtime)
      .toFilter()
    #expect(empty.hosts == [])
    #expect(empty.methods == [])
  }

  @Test
  func `a populated filter keeps its values`() throws {
    let runtime = try appContext.runtime
    let value = try runtime.eval("({ hosts: ['expo.dev'], methods: ['GET', 'POST'] })")
    let filter = try JsNetworkRequestFilter.decode(value, in: runtime).toFilter()
    #expect(filter.hosts == ["expo.dev"])
    #expect(filter.methods == ["GET", "POST"])
  }
}
