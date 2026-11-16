// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

/// Benchmarks for emitting module events to JavaScript. Each case emits from Swift in a loop to a
/// no-op JS listener. The standalone test runtime runs scheduled work synchronously, so every operation
/// covers the whole path: scheduling, converting the payload, reaching the module's JavaScript object
/// and calling the listener. Read the payload cases against `emit: no payload`.
extension Benchmarks {
  @Test
  func `emit: no payload`() async throws {
    try await eventBenchmarkCase { module, runtime in
      try benchmark("emit: no payload", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          module.emit(event: "ping")
        }
      }
    }
  }

  @Test
  func `emit: no payload through @Event`() async throws {
    try await eventBenchmarkCase { module, runtime in
      try benchmark("emit: no payload through @Event", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          module.onPing()
        }
      }
    }
  }

  @Test
  func `emit: no payload, 100 other modules registered`() async throws {
    try await eventBenchmarkCase(otherModuleCount: 100) { module, runtime in
      try benchmark("emit: no payload, 100 other modules registered", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          module.emit(event: "ping")
        }
      }
    }
  }

  @Test
  func `emit: Int payload`() async throws {
    try await eventBenchmarkCase { module, runtime in
      try benchmark("emit: Int payload", runtime: runtime) { iterations in
        for index in 0..<iterations {
          module.emit(event: "count", payload: index)
        }
      }
    }
  }

  @Test
  func `emit: Int payload through @Event`() async throws {
    try await eventBenchmarkCase { module, runtime in
      try benchmark("emit: Int payload through @Event", runtime: runtime) { iterations in
        for index in 0..<iterations {
          module.onCount(index)
        }
      }
    }
  }

  @Test
  func `emit: Int payload as AnyArgument`() async throws {
    try await eventBenchmarkCase { module, runtime in
      try benchmark("emit: Int payload as AnyArgument", runtime: runtime) { iterations in
        for index in 0..<iterations {
          emitAsAnyArgument(module, event: "count", payload: index)
        }
      }
    }
  }

  @Test
  func `emit: record payload`() async throws {
    try await eventBenchmarkCase { module, runtime in
      try benchmark("emit: record payload", runtime: runtime) { iterations in
        for index in 0..<iterations {
          module.emit(event: "progress", payload: ProgressPayload(percent: index, label: "loading"))
        }
      }
    }
  }

  @Test
  func `emit: record payload through @Event`() async throws {
    try await eventBenchmarkCase { module, runtime in
      try benchmark("emit: record payload through @Event", runtime: runtime) { iterations in
        for index in 0..<iterations {
          module.onProgress(ProgressPayload(percent: index, label: "loading"))
        }
      }
    }
  }

  @Test
  func `emit: record payload as AnyArgument`() async throws {
    try await eventBenchmarkCase { module, runtime in
      try benchmark("emit: record payload as AnyArgument", runtime: runtime) { iterations in
        for index in 0..<iterations {
          emitAsAnyArgument(module, event: "progress", payload: ProgressPayload(percent: index, label: "loading"))
        }
      }
    }
  }

  @Test
  func `emit: shared object payload`() async throws {
    try await eventBenchmarkCase { module, runtime in
      // Encoding the object once pairs it with a JavaScript object, as an object already used from
      // JavaScript would be. Holding that object keeps the pair alive across garbage collections.
      // A shared object isn't `Sendable`, so it can't be sent to `emit` more than once without
      // opting out of the check, and an `@Event` with this payload type doesn't compile.
      nonisolated(unsafe) let payload = EventPayloadObject()
      let payloadObject = try EventPayloadObject.encode(payload, in: runtime)

      try withExtendedLifetime(payloadObject) {
        try benchmark("emit: shared object payload", runtime: runtime) { iterations in
          for _ in 0..<iterations {
            module.emit(event: "object", payload: payload)
          }
        }
      }
    }
  }

  @Test
  func `emit: [String: Any] payload`() async throws {
    try await eventBenchmarkCase { module, runtime in
      // `[String: Any]` isn't `Sendable`, so an `@Event` with this payload type doesn't compile.
      try benchmark("emit: [String: Any] payload", runtime: runtime) { iterations in
        for index in 0..<iterations {
          module.emit(event: "dictionary", payload: ["percent": index, "label": "loading"] as [String: Any])
        }
      }
    }
  }

  @Test
  func `emit: [String: String] payload through @Event`() async throws {
    try await eventBenchmarkCase { module, runtime in
      try benchmark("emit: [String: String] payload through @Event", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          module.onStrings(["state": "loading", "label": "file"])
        }
      }
    }
  }
}

@Record
private struct ProgressPayload {
  var percent: Int = 0
  var label: String = ""
}

private final class EventPayloadObject: SharedObject {}

@ExpoModule
private final class EventBenchmarkModule: Module {
  @Event
  var onPing: () -> Void

  @Event
  var onCount: (Int) -> Void

  @Event
  var onProgress: (ProgressPayload) -> Void

  @Event
  var onStrings: ([String: String]) -> Void
}

@ExpoModule
private final class IdleModule: Module {}

/// Runs one case with a fresh app context that has `EventBenchmarkModule` registered, with a no-op
/// JavaScript listener on each of its events. `otherModuleCount` more modules are registered first.
private func eventBenchmarkCase(
  otherModuleCount: Int = 0,
  _ body: @escaping @JavaScriptActor (EventBenchmarkModule, JavaScriptRuntime) throws -> Void
) async throws {
  try await moduleBenchmarkCase { appContext in
    for index in 0..<otherModuleCount {
      appContext.moduleRegistry.register(module: IdleModule(appContext: appContext), name: "IdleModule\(index)")
    }
    return EventBenchmarkModule(appContext: appContext)
  } _: { module, runtime in
    try runtime.eval(
      """
      const listener = () => {};
      expo.modules.EventBenchmarkModule.addListener('ping', listener);
      expo.modules.EventBenchmarkModule.addListener('count', listener);
      expo.modules.EventBenchmarkModule.addListener('progress', listener);
      expo.modules.EventBenchmarkModule.addListener('object', listener);
      expo.modules.EventBenchmarkModule.addListener('dictionary', listener);
      expo.modules.EventBenchmarkModule.addListener('strings', listener);
      """
    )
    try body(module, runtime)
  }
}

/// Emits through the `AnyArgument` overload, which a direct call doesn't reach for a payload that is
/// also `JavaScriptEncodable`.
private func emitAsAnyArgument<P: AnyArgument>(_ module: EventBenchmarkModule, event: String, payload: sending P) {
  module.emit(event: event, payload: payload)
}
