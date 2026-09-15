// Copyright 2025-present 650 Industries. All rights reserved.

import QuartzCore
import ExpoModulesCore

/// Process-wide counters for benchmarking the JSI view-props decoding path against the legacy
/// `folly::dynamic` / `NSDictionary` path. Fed by the benchmark harness via expo-modules-core's
/// view lifecycle hooks (`viewWillUpdateProps`/`viewDidUpdateProps` bracket the main-thread apply)
/// and the `ViewPropsJSIDecoder.onDecodePass` observer (JS-thread decode). No timing is wired into
/// core itself.
///
/// Times accumulate in seconds (via `CACurrentMediaTime`, a monotonic clock). Reads/writes aren't
/// synchronized: the harness drives updates serially (Fabric parses props on the JS thread, applies
/// on the main thread, and the harness waits between batches), and the small races that remain don't
/// matter for a benchmark counter.
///
/// Every counter is `nonisolated(unsafe)` deliberately: without it, Swift guards each access to a
/// mutable static with a `swift_once` lazy-init check, which on the per-prop / per-pass hot path
/// measurably inflates the very numbers being measured.
enum ViewPropsBenchmark {
  /// Accumulated seconds spent decoding props from JS values on the JavaScript thread.
  nonisolated(unsafe) static var decodeSeconds: Double = 0

  /// Accumulated seconds spent applying props to views on the main thread.
  nonisolated(unsafe) static var applySeconds: Double = 0

  /// Number of individual props decoded straight from their JS value on the JS thread.
  nonisolated(unsafe) static var decodedPropCount: Int = 0

  /// Number of props *presented* to the legacy (dictionary) path, summed across passes. Not the
  /// number applied: the legacy `propsMap` is sticky, so a single-prop change still presents the
  /// full set. Stays zero while the JSI descriptor is in use, so it doubles as a "did anything
  /// fall back" signal.
  nonisolated(unsafe) static var legacyPresentedPropCount: Int = 0

  /// Number of decode passes that ran on the JS thread. Fabric may call `cloneProps` more than
  /// once per visual update, so this can exceed the number of apply passes.
  nonisolated(unsafe) static var decodePassCount: Int = 0

  /// Number of apply passes that ran on the main thread (one per `finalizeUpdates`).
  nonisolated(unsafe) static var applyPassCount: Int = 0

  /// Returns the accumulated counters as a dictionary, with times converted to milliseconds.
  static func snapshot() -> [String: Any] {
    return [
      "decodeMs": decodeSeconds * 1000,
      "applyMs": applySeconds * 1000,
      "decodedPropCount": decodedPropCount,
      "legacyPresentedPropCount": legacyPresentedPropCount,
      "decodePassCount": decodePassCount,
      "applyPassCount": applyPassCount
    ]
  }

  /// Resets all counters to zero. Call before a measured run.
  static func reset() {
    decodeSeconds = 0
    applySeconds = 0
    decodedPropCount = 0
    legacyPresentedPropCount = 0
    decodePassCount = 0
    applyPassCount = 0
  }

  /// Attaches the JS-thread decode observer. Call once during module setup.
  static func installDecodeObserver() {
    ViewPropsJSIDecoder.onDecodePass = { seconds, propCount in
      decodeSeconds += seconds
      decodePassCount += 1
      decodedPropCount += propCount
    }
  }
}
