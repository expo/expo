import Testing

@testable import ExpoModulesCore
@testable import ExpoObserve

@Suite("NetworkRequestObserver JavaScript class", .serialized)
@JavaScriptActor
struct NetworkRequestObserverClassTests {
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
  func `the class is exposed as NetworkRequestObserver`() throws {
    #expect(try runtime.eval("typeof expo.modules.ExpoAppMetrics.NetworkRequestObserver").asString() == "function")
  }
}
