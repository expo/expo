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
  func `an omitted filter field stays nil and an empty one stays empty`() throws {
    let runtime = try appContext.runtime
    let omitted = try NetworkRequestFilterRecord.decode(runtime.eval("({})"), in: runtime).toFilter()
    #expect(omitted.hosts == nil)
    #expect(omitted.methods == nil)

    let empty = try NetworkRequestFilterRecord.decode(runtime.eval("({ hosts: [], methods: [] })"), in: runtime)
      .toFilter()
    #expect(empty.hosts == [])
    #expect(empty.methods == [])
  }

  @Test
  func `a populated filter keeps its values`() throws {
    let runtime = try appContext.runtime
    let value = try runtime.eval("({ hosts: ['expo.dev'], methods: ['GET', 'POST'] })")
    let filter = try NetworkRequestFilterRecord.decode(value, in: runtime).toFilter()
    #expect(filter.hosts == ["expo.dev"])
    #expect(filter.methods == ["GET", "POST"])
  }
}
