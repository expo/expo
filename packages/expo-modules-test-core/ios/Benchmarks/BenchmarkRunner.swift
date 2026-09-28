// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Foundation

// The benchmark runner shared by the pods' `Benchmarks` test specs, which `et native-unit-tests
// --benchmarks` builds in the Release configuration so the numbers are meaningful. `expo-modules-jsi`
// keeps its own copy in `apple/Benchmarks/BenchmarkRunner.swift`: it is a SwiftPM package and cannot
// depend on this pod. Keep the two in sync.

/// Runs one benchmark case inside a high-priority task. The priority matters: the testing library
/// runs tests at default priority, whose threads the scheduler sometimes places on efficiency cores,
/// which shows up as multi-fold run-to-run swings in the results. Create the runtime, the measured
/// values, and the `benchmark(_:runtime:samples:_:)` calls inside the closure.
public func benchmarkCase(_ body: @escaping @JavaScriptActor () throws -> Void) async throws {
  try await Task(priority: .high) { @JavaScriptActor in
    try body()
  }.value
}

/// Runs the given body repeatedly and prints a single-line report with the median and
/// minimum time per operation. The body receives the number of operations to perform,
/// either in a Swift loop or by passing the count to a JavaScript driver function.
///
/// The iteration count is calibrated so that a single sample takes roughly 50ms, and the
/// garbage collector runs between samples so collection pauses triggered by garbage from
/// one sample don't land in the next one's measurement.
@JavaScriptActor
public func benchmark(
  _ name: String,
  runtime: JavaScriptRuntime,
  samples sampleCount: Int = 7,
  _ body: (_ iterations: Int) throws -> Void
) rethrows {
  let clock = ContinuousClock()
  var iterations = try calibrateIterations(clock: clock, body)
  // The warmup run doubles as the second calibration phase: it runs at the estimated
  // iteration count, which is more representative than the short runs the estimate came
  // from (caches are warm, one-time costs are paid), so rescale the count from it.
  let warmupElapsed = try clock.measure {
    try body(iterations)
  }
  iterations = rescaleIterations(iterations, elapsed: warmupElapsed)
  var nanosecondsPerOperation = [Double]()
  for _ in 0..<sampleCount {
    runtime.collectGarbage()
    let elapsed = try clock.measure {
      try body(iterations)
    }
    nanosecondsPerOperation.append(Double(elapsed.nanoseconds) / Double(iterations))
  }
  nanosecondsPerOperation.sort()
  let median = format(nanosecondsPerOperation[nanosecondsPerOperation.count / 2])
  let minimum = format(nanosecondsPerOperation[0])
  print(
    "[benchmark] \(name): median \(median) ns/op, min \(minimum) ns/op"
      + " (\(iterations) iterations, \(sampleCount) samples)"
  )
}

/// How long a single measured sample should take.
private let targetSampleNanoseconds = 50_000_000.0

/// Finds an iteration count that makes one sample take roughly 50ms. Starts at a single
/// iteration and grows tenfold until the measured time is long enough to extrapolate from,
/// so even sub-nanosecond bodies calibrate quickly without overshooting.
@JavaScriptActor
private func calibrateIterations(
  clock: ContinuousClock,
  _ body: (_ iterations: Int) throws -> Void
) rethrows -> Int {
  var iterations = 1
  while true {
    let elapsed = try clock.measure {
      try body(iterations)
    }
    if elapsed >= .milliseconds(5) || iterations >= 100_000_000 {
      return rescaleIterations(iterations, elapsed: elapsed)
    }
    iterations *= 10
  }
}

/// Rescales an iteration count so the next run of that many iterations takes roughly
/// the target sample duration, given how long `iterations` of the body just took.
private func rescaleIterations(_ iterations: Int, elapsed: Duration) -> Int {
  let nanoseconds = max(elapsed.nanoseconds, 1)
  let rescaled = Int(Double(iterations) * targetSampleNanoseconds / Double(nanoseconds))
  return min(max(rescaled, 1), 100_000_000)
}

/// Formats a nanosecond quantity with a single decimal place.
private func format(_ nanoseconds: Double) -> String {
  return String(format: "%.1f", nanoseconds)
}

extension Duration {
  /// The duration expressed as a whole number of nanoseconds.
  fileprivate var nanoseconds: Int64 {
    return components.seconds * 1_000_000_000 + components.attoseconds / 1_000_000_000
  }
}
