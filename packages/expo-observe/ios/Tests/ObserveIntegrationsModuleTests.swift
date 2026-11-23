// Copyright 2026-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore
@testable import ExpoObserve

@Suite("ObserveIntegrationsModule", .serialized)
@JavaScriptActor
struct ObserveIntegrationsModuleTests {
  private let appContext: AppContext
  private let runtime: ExpoRuntime
  private let module: ObserveIntegrationsModule
  private let recorder = FakeIntegrationRecorder()

  init() throws {
    appContext = AppContext.create()
    runtime = try appContext.runtime
    module = ObserveIntegrationsModule(appContext: appContext)
    module.host = IntegrationHost(recorder: recorder)
    appContext.moduleRegistry.register(module: module, name: nil)
    try runtime.eval(
      """
      globalThis.calls = [];
      globalThis.clients = [];
      globalThis.registerIntegration = (name, label = name) => {
        expo.modules.ObserveIntegrations.register(name, (configJson, client) => {
          calls.push(configJson === null ? `${label} teardown` : `${label} setup ${configJson}`);
          if (client) {
            clients.push(client);
          }
        });
      };
      """
    )
  }

  /// Runs on the JavaScript thread, where the module calls the integrations inline.
  private func onJavaScriptThread<R: Sendable>(_ body: @escaping @JavaScriptActor () throws -> R) throws -> R {
    return try runtime.execute(body)
  }

  private func calls() throws -> String {
    return try runtime.eval("calls.join(' | ')").asString()
  }

  @Test
  func `has the API version that expo-observe-interface expects`() throws {
    #expect(try runtime.eval("expo.modules.ObserveIntegrations.apiVersion").asInt() == 1)
  }

  @Test
  func `sets up a registration when configure enables it`() throws {
    let module = module
    try onJavaScriptThread {
      try runtime.eval("registerIntegration('lib')")
      #expect(try calls().isEmpty)
      module.apply(["lib": #"{"level":1}"#, "other": "{}"])
    }

    #expect(try calls() == #"lib setup {"level":1}"#)
  }

  @Test
  func `sets up a registration at once when configure already ran in the runtime`() throws {
    let module = module
    try onJavaScriptThread {
      module.apply(["lib": "{}"])
      try runtime.eval("registerIntegration('lib')")
    }

    #expect(try calls() == "lib setup {}")
  }

  @Test
  func `tears down and sets up again only when the config changes`() throws {
    let module = module
    try onJavaScriptThread {
      try runtime.eval("registerIntegration('lib')")
      module.apply(["lib": "{}"])
      module.apply(["lib": "{}"])
      module.apply(["lib": #"{"level":2}"#])
      module.apply([:])
      module.apply([:])
    }

    #expect(try calls() == #"lib setup {} | lib teardown | lib setup {"level":2} | lib teardown"#)
  }

  @Test
  func `a registration with the same name replaces the earlier one`() throws {
    let module = module
    try onJavaScriptThread {
      module.apply(["lib": "{}"])
      try runtime.eval("registerIntegration('lib', 'first')")
      try runtime.eval("registerIntegration('lib', 'second')")
    }

    #expect(try calls() == "first setup {} | first teardown | second setup {}")
  }

  @Test
  func `the client reports for the integration`() throws {
    let module = module
    let results = try onJavaScriptThread {
      try runtime.eval("registerIntegration('lib')")
      module.apply(["lib": #"{"ignoredCodes":["Ignored"]}"#])
      return try runtime.eval(
        """
        [
          clients[0].reportError({ type: 'lib.error', message: 'boom', code: 'Code', stacktrace: 'at f' }),
          clients[0].reportError({ type: 'lib.error', message: 'ignored', code: 'Ignored' }),
          clients[0].reportWarning({
            name: 'lib.warning',
            displayName: 'Lib warning',
            message: 'slow',
            attributes: { label: 'x', count: 2, enabled: true },
          }),
          clients[0].logEvent({ name: 'lib.event', body: 'body', severity: 'debug' }),
        ].join(',')
        """
      ).asString()
    }

    #expect(results == "true,false,true,true")
    let error = try #require(recorder.errors.first)
    #expect(recorder.errors.count == 1)
    #expect(error.integration == "lib")
    #expect(error.report.type == "lib.error")
    #expect(error.report.message == "boom")
    #expect(error.report.code == "Code")
    #expect(error.report.stacktrace == "at f")
    #expect(!error.report.persistImmediately)

    let events = recorder.events
    #expect(events.count == 2)
    #expect(events.map(\.integration) == ["lib", "lib"])
    #expect(events[0].name == "lib.warning")
    #expect(events[0].displayName == "Lib warning")
    #expect(events[0].severity == .warn)
    #expect(events[0].attributes["label"] as? String == "x")
    #expect(events[0].attributes["count"] as? Double == 2)
    #expect(events[0].attributes["enabled"] as? Bool == true)
    #expect(events[1].name == "lib.event")
    #expect(events[1].body == "body")
    #expect(events[1].severity == .debug)
  }

  @Test
  func `a report with an attribute of another type throws`() throws {
    let module = module
    let result = try onJavaScriptThread {
      try runtime.eval("registerIntegration('lib')")
      module.apply(["lib": "{}"])
      return try runtime.eval(
        """
        (() => {
          try {
            clients[0].reportWarning({ name: 'lib.warning', message: 'slow', attributes: { value: null } });
            return 'reported';
          } catch {
            return 'threw';
          }
        })()
        """
      ).asString()
    }

    #expect(result == "threw")
    #expect(recorder.events.isEmpty)
  }

  @Test
  func `the client of a torn down setup reports nothing`() throws {
    let module = module
    let result = try onJavaScriptThread {
      try runtime.eval("registerIntegration('lib')")
      module.apply(["lib": "{}"])
      module.apply([:])
      return try runtime.eval("clients[0].reportError({ type: 'lib.error', message: 'boom' })").asBool()
    }

    #expect(!result)
    #expect(recorder.errors.isEmpty)
  }

  @Test
  func `sets up a registration only while consent is granted`() throws {
    let module = module
    recorder.isConsentGranted = false
    try onJavaScriptThread {
      try runtime.eval("registerIntegration('lib')")
      module.apply(["lib": "{}"])
    }
    #expect(try calls().isEmpty)

    recorder.isConsentGranted = true
    module.consentDidChange()
    #expect(try calls() == "lib setup {}")

    recorder.isConsentGranted = false
    module.consentDidChange()
    #expect(try calls() == "lib setup {} | lib teardown")
  }

  @Test
  func `stops the clients without calling JavaScript when the module is destroyed`() throws {
    let module = module
    let result = try onJavaScriptThread {
      try runtime.eval("registerIntegration('lib')")
      module.apply(["lib": "{}"])
      module.willDestroy()
      return try runtime.eval("clients[0].reportError({ type: 'lib.error', message: 'boom' })").asBool()
    }

    #expect(!result)
    #expect(try calls() == "lib setup {}")
  }
}
