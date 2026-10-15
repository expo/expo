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
  func `emit: record payload as AnyArgument`() async throws {
    try await eventBenchmarkCase { module, runtime in
      try benchmark("emit: record payload as AnyArgument", runtime: runtime) { iterations in
        for index in 0..<iterations {
          emitAsAnyArgument(module, event: "progress", payload: ProgressPayload(percent: index, label: "loading"))
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

@ExpoModule
private final class EventBenchmarkModule: Module {
  @Event
  var onPing: () -> Void

  @Event
  var onCount: (Int) -> Void

  @Event
  var onProgress: (ProgressPayload) -> Void
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
