import Foundation
import Testing

@testable import ExpoAppMetrics
@testable import ExpoModulesCore

@Suite("Span JavaScript class", .serialized)
@JavaScriptActor
final class SpanClassTests {
  let appContext: AppContext
  let runtime: ExpoRuntime
  let consent = Mutex(true)

  init() throws {
    appContext = AppContext.create()
    runtime = try appContext.runtime
    let module = AppMetricsModule(appContext: appContext)
    module.isConsentGranted = { [weak self] in self?.consent.withLock { $0 } ?? false }
    appContext.moduleRegistry.register(
      holder: ModuleHolder(
        appContext: appContext,
        module: module,
        name: "ExpoAppMetrics"
      )
    )
  }

  @Test
  func `the class is exposed as Span`() throws {
    // The Swift type is `SpanHandle`; JavaScript sees the `@SharedObject("Span")` name, as on Android.
    #expect(try runtime.eval("typeof expo.modules.ExpoAppMetrics.Span").asString() == "function")
  }

  @Test
  func `constructing from JavaScript is refused`() throws {
    // A span's identity and session attribution are assigned natively at start time.
    let result = try runtime.eval(
      """
      (() => {
        try {
          new expo.modules.ExpoAppMetrics.Span()
          return 'constructed'
        } catch (error) {
          return String(error)
        }
      })()
      """
    )
    let message = try result.asString()
    #expect(message.contains("'Span' cannot be constructed from JavaScript"))
  }

  @Test
  func `starting a span with an invalid name returns a span instead of throwing`() throws {
    // The span is not recorded, but the caller's code keeps working with it.
    let type = try runtime.eval("typeof expo.modules.ExpoAppMetrics.startSpan('', {}, undefined).traceId")
    #expect(try type.asString() == "string")
  }

  @Test
  func `recording a span with an unusable time does not throw`() throws {
    try runtime.eval("expo.modules.ExpoAppMetrics.recordSpan('decode', { startTime: 123.4, endTime: 567.8 })")
  }

  @Test
  func `reports captured without consent are dropped even when the database is open at write time`() async throws {
    let id = UUID().uuidString
    _ = AppMetrics.mainSession
    for granted in [false, true] {
      consent.withLock { $0 = granted }
      let value = "\(id)-\(granted)"
      try runtime.eval(
        """
        (() => {
          const m = expo.modules.ExpoAppMetrics;
          m.reportError({ message: '\(value)' });
          m.reportFeedback({ id: 'checkout', message: '\(value)' });
          m.logEvent('checkout', { body: '\(value)' });
          m.recordSpan('\(value)', { startTime: Date.now(), endTime: Date.now() });
        })()
        """
      )
    }

    try await AppMetricsActor.isolated {
      let logs = try AppMetrics.getLogs(afterId: -1)
      let matchingLogs = logs.filter { $0.body?.contains(id) == true || $0.attributes?.contains(id) == true }
      #expect(matchingLogs.map(\.name).sorted() == ["checkout", "expo.feedback", "js.exception"])
      #expect(matchingLogs.allSatisfy { $0.body == "\(id)-true" || $0.attributes?.contains("\(id)-true") == true })
      let spans = try AppMetrics.getSpans(afterId: -1).filter { $0.name.contains(id) }
      #expect(spans.map(\.name) == ["\(id)-true"])
    }
  }
}
