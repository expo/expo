// Copyright 2026-present 650 Industries. All rights reserved.

import Testing
import ExpoModulesJSI

@testable import ExpoModulesCore

@Suite("Module")
@JavaScriptActor
struct ModuleTests {

  @Suite("EventEmitter")
  @JavaScriptActor
  struct EventEmitterTests {
    let appContext: AppContext
    var runtime: ExpoRuntime {
      get throws {
        try appContext.runtime
      }
    }

    init() {
      appContext = AppContext.create()
      appContext.moduleRegistry.register(moduleType: TestModule.self, name: nil)
    }

    private var module: TestModule? {
      return appContext.moduleRegistry.get(moduleWithName: "TestModule") as? TestModule
    }

    @Test
    func `emits events with a record payload`() throws {
      try runtime.eval(
        """
        result = null;
        expo.modules.TestModule.addListener('test event', (payload) => { result = payload });
        """
      )

      struct EventPayload: Record {
        @Field var number: Int = 123
        @Field var string: String = "test"
        @Field var boolean: Bool = true
      }

      module?.emit(event: "test event", payload: EventPayload())

      let result = try runtime.eval("result").asObject()

      #expect(try result.getProperty("number").asInt() == 123)
      #expect(try result.getProperty("string").asString() == "test")
      #expect(try result.getProperty("boolean").asBool() == true)
    }

    @Test
    func `emits events with no payload`() throws {
      try runtime.eval(
        """
        result = false;
        expo.modules.TestModule.addListener('ping', () => { result = true });
        """
      )

      module?.emit(event: "ping")

      #expect(try runtime.eval("result").asBool() == true)
    }

    @Test
    func `emits events with a pre-converted JavaScriptValue payload`() throws {
      try runtime.eval(
        """
        result = null;
        expo.modules.TestModule.addListener('test event', (payload) => { result = payload });
        """
      )

      let prebuiltPayload = try runtime.eval("({ kind: 'prebuilt', count: 7 })")

      module?.emit(event: "test event", payload: prebuiltPayload)

      let result = try runtime.eval("result").asObject()

      #expect(try result.getProperty("kind").asString() == "prebuilt")
      #expect(try result.getProperty("count").asInt() == 7)
    }

    @Test
    func `emits primitive payloads`() throws {
      try runtime.eval(
        """
        result = null;
        expo.modules.TestModule.addListener('number', (payload) => { result = payload });
        """
      )

      module?.emit(event: "number", payload: 42)

      #expect(try runtime.eval("result").asInt() == 42)
    }

    @Test
    func `routes each event to its own listeners`() throws {
      try runtime.eval(
        """
        pings = 0;
        numbers = null;
        expo.modules.TestModule.addListener('ping', () => { pings += 1 });
        expo.modules.TestModule.addListener('number', (payload) => { numbers = payload });
        """
      )

      module?.emit(event: "ping")

      #expect(try runtime.eval("pings").asInt() == 1)
      #expect(try runtime.eval("numbers").isNull() == true)
    }

    @Test
    func `does not emit to a removed listener`() throws {
      try runtime.eval(
        """
        count = 0;
        listener = () => { count += 1 };
        expo.modules.TestModule.addListener('ping', listener);
        """
      )

      module?.emit(event: "ping")
      try runtime.eval("expo.modules.TestModule.removeListener('ping', listener)")
      module?.emit(event: "ping")

      #expect(try runtime.eval("count").asInt() == 1)
    }

    @Test
    func `does not crash when emitting with no listeners`() throws {
      module?.emit(event: "ping")
      module?.emit(event: "number", payload: 42)
    }

    @Test
    func `does not crash when emitting from a module not associated with a JS object`() throws {
      // A module that was never registered has no holder in the registry, so `withEventTarget`
      // resolves to nil and the defensive branches in the public `emit` overloads should log and
      // return cleanly rather than crash.
      let detached = TestModule(appContext: appContext)

      detached.emit(event: "ignored")
      detached.emit(event: "ignored", payload: ["key": "value"])
      detached.emit(event: "ignored", payload: .undefined)
    }
  }
}

// MARK: - Test Helpers

private final class TestModule: Module {
  func definition() -> ModuleDefinition {
    Name("TestModule")
    Events("test event", "ping", "number")
  }
}
