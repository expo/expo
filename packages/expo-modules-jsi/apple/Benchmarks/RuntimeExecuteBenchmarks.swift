// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation
import Testing

/// Benchmarks for `execute` calls from outside the JavaScript thread. The JavaScript thread runs a
/// run loop and receives work the way React Native's JavaScript thread does. A blocking caller is a
/// thread without run loop sources, and its report also gives the CPU time it spends per call. The
/// async callers use code that the blocking wait doesn't touch, so they are a control for the others.
extension JSIBenchmarks {
  @Test
  func `execute from another thread with a sync closure`() async throws {
    try await blockingExecuteBenchmark("runtime.execute: blocking caller, sync closure") { runtime in
      try runtime.execute { @JavaScriptActor in
        _ = runtime.global().hasProperty("Math")
      }
    }
  }

  @Test
  func `execute from another thread with an async closure`() async throws {
    try await blockingExecuteBenchmark("runtime.execute: blocking caller, async closure") { runtime in
      try runtime.execute { @JavaScriptActor () async in
        _ = runtime.global().hasProperty("Math")
      }
    }
  }

  @Test
  func `await execute from another task with a sync closure`() async throws {
    try await asyncExecuteBenchmark("runtime.execute: async caller, sync closure") { runtime in
      try await runtime.execute { @JavaScriptActor in
        _ = runtime.global().hasProperty("Math")
      }
    }
  }

  @Test
  func `await execute from another task with an async closure`() async throws {
    try await asyncExecuteBenchmark("runtime.execute: async caller, async closure") { runtime in
      try await runtime.execute { @JavaScriptActor () async in
        _ = runtime.global().hasProperty("Math")
      }
    }
  }
}

/// Calls `call` repeatedly from a new thread without run loop sources and prints the wall and caller
/// CPU time per call.
private func blockingExecuteBenchmark(
  _ name: String,
  _ call: @escaping @Sendable (JavaScriptRuntime) throws -> Void
) async throws {
  try await withRunLoopThreadRuntime { runtime in
    try await printSamples(name) { iterations in
      return try await onCallerThread {
        let wallStart = DispatchTime.now().uptimeNanoseconds
        let cpuStart = threadCPUNanoseconds()
        for _ in 0..<iterations {
          try call(runtime)
        }
        let cpu = threadCPUNanoseconds() - cpuStart
        let wall = DispatchTime.now().uptimeNanoseconds - wallStart
        return (Double(wall), Double(cpu))
      }
    }
  }
}

/// Calls `call` repeatedly from a detached task and prints the wall time per call. The task may move
/// between threads at each `await`, so there is no caller CPU time.
private func asyncExecuteBenchmark(
  _ name: String,
  _ call: @escaping @Sendable (JavaScriptRuntime) async throws -> Void
) async throws {
  try await withRunLoopThreadRuntime { runtime in
    try await printSamples(name) { iterations in
      return try await Task.detached(priority: .high) {
        let wallStart = DispatchTime.now().uptimeNanoseconds
        for _ in 0..<iterations {
          try await call(runtime)
        }
        let wall = DispatchTime.now().uptimeNanoseconds - wallStart
        return (Double(wall), nil)
      }.value
    }
  }
}

/// Runs `body` with a runtime whose JavaScript thread is a `RunLoopThread`.
private func withRunLoopThreadRuntime(_ body: (JavaScriptRuntime) async throws -> Void) async throws {
  let jsThread = RunLoopThread()
  let runtimes = RuntimesBox()
  await jsThread.run {
    let owningRuntime = JavaScriptRuntime()
    runtimes.owningRuntime = owningRuntime
    runtimes.runtime = owningRuntime.withUnsafePointee { runtimePointer in
      JavaScriptRuntime(
        unsafePointer: runtimePointer,
        scheduler: jsThread.opaquePointer,
        dispatch: unsafeBitCast(scheduleOnRunLoopThread, to: UnsafeRawPointer.self)
      )
    }
  }
  try await body(runtimes.runtime!)
  // Releases the runtimes on the JavaScript thread, before the thread they schedule onto stops.
  await jsThread.run {
    runtimes.runtime = nil
    runtimes.owningRuntime = nil
  }
  jsThread.stop()
}

/// Calibrates an iteration count, takes the samples that `measure` returns for it, and prints the
/// time per call. `measure` returns the wall time in nanoseconds and, when it has one, the caller's
/// CPU time.
private func printSamples(
  _ name: String,
  samples sampleCount: Int = 7,
  _ measure: (_ iterations: Int) async throws -> (wall: Double, cpu: Double?)
) async throws {
  // Grows the count until a run takes 5 ms, then scales it to about 50 ms per sample.
  var iterations = 10
  while try await measure(iterations).wall < 5_000_000 {
    iterations *= 10
  }
  iterations = Int(Double(iterations) * 50_000_000 / (try await measure(iterations).wall))
  var wallPerCall = [Double]()
  var cpuPerCall = [Double]()
  for _ in 0..<sampleCount {
    let sample = try await measure(iterations)
    wallPerCall.append(sample.wall / Double(iterations))
    if let cpu = sample.cpu {
      cpuPerCall.append(cpu / Double(iterations))
    }
  }
  wallPerCall.sort()
  cpuPerCall.sort()
  var report = String(
    format: "[benchmark] %@: median %.1f ns/op, min %.1f ns/op",
    name,
    wallPerCall[sampleCount / 2],
    wallPerCall[0]
  )
  if !cpuPerCall.isEmpty {
    report += String(format: ", caller CPU median %.1f ns/op", cpuPerCall[cpuPerCall.count / 2])
  }
  print(report + " (\(iterations) iterations, \(sampleCount) samples)")
}

/// Holds the runtimes that `withRunLoopThreadRuntime` creates and releases on the JavaScript thread.
private final class RuntimesBox: @unchecked Sendable {
  var owningRuntime: JavaScriptRuntime?
  var runtime: JavaScriptRuntime?
}

/// A thread that runs its run loop in the default mode and receives work with
/// `CFRunLoopPerformBlock` and `CFRunLoopWakeUp`, like React Native's JavaScript thread.
private final class RunLoopThread: @unchecked Sendable {
  private var runLoop: CFRunLoop?

  init() {
    let ready = DispatchSemaphore(value: 0)
    let thread = Thread { [self] in
      // Without a source, the run loop would return at once instead of waiting for work.
      var context = CFRunLoopSourceContext()
      CFRunLoopAddSource(CFRunLoopGetCurrent(), CFRunLoopSourceCreate(nil, 0, &context), .defaultMode)
      runLoop = CFRunLoopGetCurrent()
      ready.signal()
      CFRunLoopRun()
    }
    thread.name = "expo.modules.jsi.benchmarks.runtime"
    thread.qualityOfService = .userInteractive
    thread.start()
    ready.wait()
  }

  var opaquePointer: UnsafeMutableRawPointer {
    return Unmanaged.passUnretained(self).toOpaque()
  }

  func schedule(_ block: @escaping @convention(block) () -> Void) {
    CFRunLoopPerformBlock(runLoop, CFRunLoopMode.commonModes.rawValue, block)
    CFRunLoopWakeUp(runLoop)
  }

  func run(_ operation: @escaping @Sendable () -> Void) async {
    await withCheckedContinuation { continuation in
      schedule {
        operation()
        continuation.resume()
      }
    }
  }

  func stop() {
    CFRunLoopStop(runLoop)
  }
}

private let scheduleOnRunLoopThread:
  @convention(c) (
    UnsafeMutableRawPointer?, Int32, @escaping @convention(block) () -> Void
  ) -> Void = { threadPointer, _, callback in
    guard let threadPointer else {
      return
    }
    Unmanaged<RunLoopThread>.fromOpaque(threadPointer).takeUnretainedValue().schedule(callback)
  }

/// Runs `body` on a new high-priority thread, which has no run loop sources, and returns its result.
private func onCallerThread<R: Sendable>(_ body: @escaping @Sendable () throws -> R) async throws -> R {
  return try await withCheckedThrowingContinuation { continuation in
    let thread = Thread {
      continuation.resume(with: Result { try body() })
    }
    thread.qualityOfService = .userInteractive
    thread.start()
  }
}

private func threadCPUNanoseconds() -> UInt64 {
  return clock_gettime_nsec_np(CLOCK_THREAD_CPUTIME_ID)
}
