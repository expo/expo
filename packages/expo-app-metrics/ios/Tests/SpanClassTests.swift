import ExpoModulesTestCore
import Testing

@testable import ExpoAppMetrics
@testable import ExpoModulesCore

@Suite("Span JavaScript class", .serialized)
@JavaScriptActor
struct SpanClassTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = AppContext.create()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(
      holder: ModuleHolder(
        appContext: appContext,
        module: AppMetricsModule(appContext: appContext),
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
}
