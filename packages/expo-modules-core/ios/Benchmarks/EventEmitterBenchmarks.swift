// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

/// Benchmarks for emitting events from Swift to JavaScript. Each case emits from Swift in a loop to a
/// no-op JS listener. The standalone test runtime runs scheduled work synchronously, so every operation
/// covers the whole path: scheduling, converting the payload, reaching the emitter's JavaScript object
/// and calling the listener. Read the payload cases and `emit: no payload to a JS-only EventEmitter`
/// against `emit: no payload`, and `emit: Int payload without listeners` against `emit: Int payload`.
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

  @Test
  func `emit: Int payload without listeners`() async throws {
    try await eventBenchmarkCase { module, runtime in
      try benchmark("emit: Int payload without listeners", runtime: runtime) { iterations in
        for index in 0..<iterations {
          module.emit(event: "unheard", payload: index)
        }
      }
    }
  }

  @Test
  func `emit: no payload to a JS-only EventEmitter`() async throws {
    try await appContextBenchmarkCase { appContext in
      let runtime = try appContext.runtime
      try runtime.eval("var emitter = new expo.EventEmitter(); emitter.addListener('ping', () => {})")
      let object = try runtime.eval("emitter").asObject()
      let emitter = JavaScriptOnlyEventEmitter(appContext: appContext, object: object)

      try benchmark("emit: no payload to a JS-only EventEmitter", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          emitter.emit(event: "ping")
        }
      }
    }
  }
}

/// Benchmarks for JavaScript using an `EventEmitter`. Each case runs on three emitters: one that
/// JavaScript created with `new expo.EventEmitter()`, a module and a shared object. A JavaScript driver
/// runs the measured loop, so read these results against `JS: empty driver loop`.
///
/// Notes on reading the results:
/// - `JS: addListener and remove` adds the only listener of an event and removes it with the
///   subscription, so each operation also tells the emitter that it starts and stops listening. A module
///   gets that through its native listening hook. The other emitters look up the observing functions,
///   such as `startObserving`, on their JavaScript object.
/// - `JS: addListener and remove with another listener` does the same for an event that has one more
///   listener, so the emitter doesn't start or stop listening.
/// - `JS: emit` emits a number payload to no-op listeners.
extension Benchmarks {
  @Test(arguments: EventEmitterBenchmarkTarget.allCases)
  func `JS: addListener and remove`(target: EventEmitterBenchmarkTarget) async throws {
    let body = "emitter.addListener('ping', listener).remove();"
    try await javaScriptEventBenchmarkCase(target: target, body: body) { run, runtime in
      try benchmark("JS: addListener and remove on \(target)", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test(arguments: EventEmitterBenchmarkTarget.allCases)
  func `JS: addListener and remove with another listener`(target: EventEmitterBenchmarkTarget) async throws {
    let body = "emitter.addListener('ping', listener).remove();"
    try await javaScriptEventBenchmarkCase(target: target, listenerCount: 1, body: body) { run, runtime in
      try benchmark("JS: addListener and remove with another listener on \(target)", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test(arguments: EventEmitterBenchmarkTarget.allCases, [1, 5])
  func `JS: emit`(target: EventEmitterBenchmarkTarget, listenerCount: Int) async throws {
    let listeners = listenerCount == 1 ? "1 listener" : "\(listenerCount) listeners"
    let body = "emitter.emit('ping', i);"
    try await javaScriptEventBenchmarkCase(target: target, listenerCount: listenerCount, body: body) { run, runtime in
      try benchmark("JS: emit with \(listeners) on \(target)", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }
}

/// The emitters that the JavaScript event cases run on.
enum EventEmitterBenchmarkTarget: String, CaseIterable, CustomStringConvertible, Sendable {
  case javaScriptOnly = "a JS-only EventEmitter"
  case module = "a module"
  case sharedObject = "a shared object"

  var description: String {
    return rawValue
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

/// A native emitter for an object that `new expo.EventEmitter()` created in JavaScript. It has no module
/// or shared object, so it holds the JavaScript object itself.
private final class JavaScriptOnlyEventEmitter: EventEmitter {
  weak var appContext: AppContext?
  private let object: JavaScriptObject

  init(appContext: AppContext, object: consuming JavaScriptObject) {
    self.appContext = appContext
    self.object = object
  }

  @JavaScriptActor
  func withEventTarget<R>(_ body: (borrowing JavaScriptObject) throws -> R) rethrows -> R? {
    return try body(object)
  }
}

/// Runs one case with `EventBenchmarkModule` registered and a JavaScript driver that runs `body` in a
/// loop, with the emitter of `target` in `emitter` and a no-op function in `listener`. The emitter has
/// `listenerCount` no-op listeners of the `ping` event.
private func javaScriptEventBenchmarkCase(
  target: EventEmitterBenchmarkTarget,
  listenerCount: Int = 0,
  body: String,
  _ measure: @escaping @JavaScriptActor (borrowing JavaScriptFunction, JavaScriptRuntime) throws -> Void
) async throws {
  try await moduleBenchmarkCase { appContext in
    return EventBenchmarkModule(appContext: appContext)
  } _: { _, runtime in
    switch target {
    case .javaScriptOnly:
      try runtime.eval("var benchmarkEmitter = new expo.EventEmitter()")
    case .module:
      try runtime.eval("var benchmarkEmitter = expo.modules.EventBenchmarkModule")
    case .sharedObject:
      // The global keeps the JavaScript object, and with it the pair with the native object, alive across
      // garbage collections.
      let object = try EventPayloadObject.encode(EventPayloadObject(), in: runtime)
      runtime.global().setProperty("benchmarkEmitter", value: object)
    }
    try runtime.eval("for (var k = 0; k < \(listenerCount); k++) { benchmarkEmitter.addListener('ping', () => {}); }")
    let run = try javaScriptDriver(
      runtime,
      setup: "var emitter = benchmarkEmitter; var listener = () => {};",
      body: body
    )
    try measure(run, runtime)
  }
}
