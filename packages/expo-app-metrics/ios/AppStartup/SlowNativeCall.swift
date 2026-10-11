// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// A synchronous Expo module function (or property accessor) that blocked a JavaScript runtime
/// thread for longer than the threshold, as reported by `SyncFunctionCallProfiler`.
///
/// This is the JS-thread counterpart of `MainThreadStall`: a sync native call that waits — on a
/// lock, another thread, an XPC service, the disk — holds up React's commit while the main thread
/// looks idle, so neither the main-thread watchdog nor MetricKit's hang diagnostics see it.
struct SlowNativeCall: Codable, Sendable, Equatable {
  /// Startup threshold: a sync call this long is a measurable share of time-to-first-render.
  static let startupThreshold: TimeInterval = 0.05
  /// After TTI only calls that cost a visible frame or more are kept.
  static let steadyStateThreshold: TimeInterval = 0.1

  /// Module name as JavaScript sees it, or `Module.Class` for class methods.
  let module: String
  /// Function or property name.
  let function: String
  /// `function`, `property_getter` or `property_setter`.
  let kind: String
  /// `js` for the JavaScript runtime thread, `main` when the call ran on the main thread
  /// (the UI worklet runtime).
  let thread: String
  /// Startup phase the call ended in: `beforeFirstRender`, `beforeInteractive`, or `afterInteractive`
  /// for anything outside the measured launch window (TTI reached, interrupted or prewarmed launch).
  let phase: String
  /// Seconds between `didFinishLaunching` (or `main` before that) and the start of the call.
  /// `nil` when the launch has no marker to anchor to (prewarmed launches).
  let startedAt: TimeInterval?
  /// Seconds the call blocked its thread.
  let duration: TimeInterval

  init(call: SlowSyncCall, phase: String, anchor: CFTimeInterval?) {
    module = call.identity.ownerName
    function = call.identity.name
    kind = call.identity.kind.rawValue
    thread = call.onMainThread ? "main" : "js"
    self.phase = phase
    startedAt = anchor.map { call.startedAt - $0 }
    duration = call.duration
  }

  init(
    module: String,
    function: String,
    kind: String,
    thread: String,
    phase: String,
    startedAt: TimeInterval?,
    duration: TimeInterval
  ) {
    self.module = module
    self.function = function
    self.kind = kind
    self.thread = thread
    self.phase = phase
    self.startedAt = startedAt
    self.duration = duration
  }

  var qualifiedName: String {
    return module.isEmpty ? function : "\(module).\(function)"
  }

  /// Builds the `native_module.slow_sync_call` log event.
  func toLogRecord(timestamp: Date) -> LogRecord {
    var attributes: [String: Any] = [
      "expo.native_call.module": module,
      "expo.native_call.function": function,
      "expo.native_call.kind": kind,
      "expo.native_call.thread": thread,
      "expo.native_call.phase": phase,
      "expo.native_call.duration_ms": (duration * 1000).rounded()
    ]
    if let startedAt {
      attributes["expo.native_call.started_at_ms"] = (startedAt * 1000).rounded()
    }
    return LogRecord(
      name: "native_module.slow_sync_call",
      attributes: attributes,
      severity: .warn,
      timestamp: timestamp.ISO8601Format(.init(includingFractionalSeconds: true))
    )
  }
}

/// Totals over the slow sync calls seen before `timeToInteractive`. Attached to the TTI metric
/// so a slow launch can be tied to a module without joining logs.
struct SlowNativeCallSummary: Sendable, Equatable {
  var count = 0
  var totalDuration: TimeInterval = 0
  var longestDuration: TimeInterval = 0
  /// Qualified name of the single longest call.
  var slowest: String?

  var isEmpty: Bool {
    return count == 0
  }

  mutating func add(_ call: SlowNativeCall) {
    count += 1
    totalDuration += call.duration
    if call.duration > longestDuration {
      longestDuration = call.duration
      slowest = call.qualifiedName
    }
  }
}
