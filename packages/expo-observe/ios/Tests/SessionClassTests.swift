import Testing

@testable import ExpoModulesCore
@testable import ExpoObserve

@Suite("Session JavaScript class", .serialized)
@JavaScriptActor
struct SessionClassTests {
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
  func `the class is exposed as Session`() throws {
    #expect(try runtime.eval("typeof expo.modules.ExpoAppMetrics.Session").asString() == "function")
  }

  @Test
  func `getMainSession returns the identical object on every call`() throws {
    let same = try runtime.eval(
      "expo.modules.ExpoAppMetrics.getMainSession() === expo.modules.ExpoAppMetrics.getMainSession()"
    )
    #expect(try same.asBool() == true)
  }

  @Test
  func `the main session object exposes the main session`() throws {
    #expect(try runtime.eval("expo.modules.ExpoAppMetrics.getMainSession().id").asString() == AppMetrics.mainSession.id)
    #expect(try runtime.eval("expo.modules.ExpoAppMetrics.getMainSession().type").asString() == "main")
  }
}
