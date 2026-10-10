// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation
import QuartzCore

/// One stretch during the launch window in which the main thread did not get around to running
/// a trivial block for longer than the stall threshold.
///
/// This is the shape of the problem that launch-time metrics can't show: TTFR and TTI say *that*
/// startup was slow, the stall's backtrace says *what* the main thread was doing — typically a
/// synchronous XPC call, a lock, or a file read in a module's initializer.
struct MainThreadStall: Codable, Sendable {
  /// Frames rendered into `expo.stall.stacktrace`.
  private static let maxLogStackFrames = 50
  private static let maxLogStacktraceLength = 16_384

  /// Seconds between the monitor's anchor (`didFinishLaunching`) and the start of the stall.
  let startedAt: TimeInterval
  /// Seconds the main thread was unresponsive. Measured from the ping that went unanswered, so it
  /// understates the true stall by at most one ping interval.
  let duration: TimeInterval
  /// `true` when the monitor was stopped while the main thread was still blocked; `duration` is
  /// then the time blocked so far.
  let unfinished: Bool
  /// Main-thread call stack sampled once the threshold was crossed, symbolicated on device.
  let callStackTree: CrashReport.CallStackTree?

  /// Builds the `app_startup.main_thread_stall` log event. `phase` names where in the startup
  /// sequence the stall happened (`beforeFirstRender`, `beforeInteractive`).
  func toLogRecord(phase: String, timestamp: Date) -> LogRecord {
    let rendered = callStackTree?.render(maxFrames: Self.maxLogStackFrames, maxLength: Self.maxLogStacktraceLength)
    var attributes: [String: Any] = [
      "expo.stall.thread": "main",
      "expo.stall.phase": phase,
      "expo.stall.started_at_ms": (startedAt * 1000).rounded(),
      "expo.stall.duration_ms": (duration * 1000).rounded(),
      "expo.stall.unfinished": unfinished,
    ]
    if let rendered, rendered.renderedFrameCount > 0 {
      attributes["expo.stall.stacktrace"] = rendered.stacktrace as Any
      attributes["expo.stall.rendered_frame_count"] = rendered.renderedFrameCount
      attributes["expo.stall.total_frame_count"] = rendered.totalFrameCount
      if let binaryUUIDs = rendered.binaryUUIDs {
        attributes["expo.stall.binary_uuids"] = binaryUUIDs
      }
    }
    return LogRecord(
      name: "app_startup.main_thread_stall",
      attributes: attributes,
      severity: .warn,
      timestamp: timestamp.ISO8601Format(.init(includingFractionalSeconds: true))
    )
  }
}

/// Totals over the stalls seen in one launch window. Attached to the `timeToInteractive` metric
/// so a startup distribution can be split by "had a stall" without joining against logs.
struct MainThreadStallSummary: Sendable, Equatable {
  var count = 0
  var totalDuration: TimeInterval = 0
  var longestDuration: TimeInterval = 0

  mutating func add(_ stall: MainThreadStall) {
    count += 1
    totalDuration += stall.duration
    longestDuration = max(longestDuration, stall.duration)
  }
}

/// Watches the main thread between `didFinishLaunching` and `timeToInteractive`.
///
/// A dedicated thread posts a trivial block to the main queue every `pingInterval`. If the block
/// hasn't run after `stallThreshold`, the main thread's call stack is captured once (see
/// `ThreadBacktrace`) and the stall is reported when the block finally runs. The monitor stops
/// itself after `maxMonitoringDuration` so a launch that never reaches TTI doesn't keep it alive.
///
/// Cost while idle: one block on the main queue every 50 ms for a few seconds. The capture itself
/// suspends the main thread for the microseconds it takes to walk ≤128 frames.
final class MainThreadStallMonitor: @unchecked Sendable {
  struct Configuration: Sendable {
    var pingInterval: TimeInterval = 0.05
    var stallThreshold: TimeInterval = 0.15
    var maxMonitoringDuration: TimeInterval = 10
  }

  private struct OpenStall {
    let startedAt: CFTimeInterval
    let callStackTree: CrashReport.CallStackTree?
  }

  private let configuration: Configuration
  private let lock = NSLock()
  private var generation = 0
  private var running = false
  private var anchor: CFTimeInterval = 0
  private var onStall: (@Sendable (MainThreadStall, Date) -> Void)?
  private var summary = MainThreadStallSummary()
  private var pingSentAt: CFTimeInterval?
  private var openStall: OpenStall?
  /// The main thread is always the first entry `task_threads` returns. Resolved once, off the main
  /// thread, before any capture.
  private lazy var mainThread: thread_t? = {
    var list: thread_act_array_t?
    var count: mach_msg_type_number_t = 0
    guard task_threads(mach_task_self_, &list, &count) == KERN_SUCCESS, let list, count > 0 else {
      return nil
    }
    let main = list[0]
    for index in 1..<Int(count) {
      mach_port_deallocate(mach_task_self_, list[index])
    }
    let size = vm_size_t(Int(count) * MemoryLayout<thread_t>.stride)
    vm_deallocate(mach_task_self_, vm_address_t(UInt(bitPattern: list)), size)
    return main
  }()

  init(configuration: Configuration = Configuration()) {
    self.configuration = configuration
  }

  /// Starts watching. `anchor` is the `CACurrentMediaTime()` the stall offsets are relative to.
  /// `onStall` is called from the monitor thread once per stall, with the wall-clock time it ended.
  func start(anchor: CFTimeInterval, onStall: @escaping @Sendable (MainThreadStall, Date) -> Void) {
    lock.lock()
    if running {
      lock.unlock()
      return
    }
    running = true
    generation += 1
    self.anchor = anchor
    self.onStall = onStall
    summary = MainThreadStallSummary()
    pingSentAt = nil
    openStall = nil
    let generation = generation
    lock.unlock()

    let thread = Thread { [self] in
      run(generation: generation)
    }
    thread.name = "expo.app-metrics.stall-monitor"
    thread.qualityOfService = .userInitiated
    thread.stackSize = 256 * 1024
    thread.start()
  }

  /// Stops watching and returns the totals. A stall still in progress is closed as `unfinished`.
  @discardableResult
  func stop() -> MainThreadStallSummary {
    lock.lock()
    guard running else {
      let summary = summary
      lock.unlock()
      return summary
    }
    running = false
    let unfinished = openStall.map { open in
      MainThreadStall(
        startedAt: open.startedAt - anchor,
        duration: CACurrentMediaTime() - open.startedAt,
        unfinished: true,
        callStackTree: open.callStackTree
      )
    }
    openStall = nil
    pingSentAt = nil
    if let unfinished {
      summary.add(unfinished)
    }
    let summary = summary
    let callback = onStall
    onStall = nil
    lock.unlock()
    if let unfinished {
      callback?(unfinished, Date.now)
    }
    return summary
  }

  private func run(generation: Int) {
    let startedAt = CACurrentMediaTime()
    let buffer = UnsafeMutablePointer<UInt64>.allocate(capacity: ThreadBacktrace.maxFrames)
    defer {
      buffer.deallocate()
    }
    while true {
      lock.lock()
      guard running, self.generation == generation else {
        lock.unlock()
        return
      }
      let now = CACurrentMediaTime()
      if now - startedAt > configuration.maxMonitoringDuration {
        lock.unlock()
        stop()
        return
      }
      var shouldPing = false
      var shouldCapture = false
      if let sentAt = pingSentAt {
        if openStall == nil, now - sentAt >= configuration.stallThreshold {
          shouldCapture = true
        }
      } else {
        pingSentAt = now
        shouldPing = true
      }
      lock.unlock()

      if shouldPing {
        DispatchQueue.main.async { [self] in
          pong(generation: generation)
        }
      }
      if shouldCapture {
        let frameCount = mainThread.map {
          ThreadBacktrace.capture(thread: $0, into: buffer, capacity: ThreadBacktrace.maxFrames)
        } ?? 0
        let addresses = Array(UnsafeBufferPointer(start: buffer, count: frameCount))
        let tree = addresses.isEmpty
          ? nil
          : CrashReportSymbolicator.symbolicate(CrashReport.CallStackTree.fromAddresses(addresses))
        lock.lock()
        if running, self.generation == generation, openStall == nil, let sentAt = pingSentAt {
          openStall = OpenStall(startedAt: sentAt, callStackTree: tree)
        }
        lock.unlock()
      }
      Thread.sleep(forTimeInterval: configuration.pingInterval)
    }
  }

  /// Runs on the main thread when it gets to the ping. A ping that was outstanding long enough to
  /// open a stall closes it here.
  private func pong(generation: Int) {
    let now = CACurrentMediaTime()
    lock.lock()
    guard running, self.generation == generation else {
      lock.unlock()
      return
    }
    pingSentAt = nil
    guard let open = openStall else {
      lock.unlock()
      return
    }
    openStall = nil
    let stall = MainThreadStall(
      startedAt: open.startedAt - anchor,
      duration: now - open.startedAt,
      unfinished: false,
      callStackTree: open.callStackTree
    )
    summary.add(stall)
    let callback = onStall
    lock.unlock()
    callback?(stall, Date.now)
  }
}
