import Foundation
import Testing

@testable import ExpoAppMetrics

@Suite("MainThreadStall")
struct MainThreadStallTests {
  @Test
  func `log record carries duration, offset, phase and the rendered stack`() throws {
    let tree = CrashReport.CallStackTree(callStacks: [
      .init(
        threadAttributed: true,
        callStackRootFrames: [
          .init(
            binaryName: "libdispatch.dylib",
            binaryUUID: "A",
            address: 100,
            offsetIntoBinaryTextSegment: 16,
            sampleCount: 1,
            subFrames: [
              .init(
                binaryName: "App",
                binaryUUID: "B",
                address: 200,
                offsetIntoBinaryTextSegment: 32,
                sampleCount: 1,
                subFrames: nil,
                symbol: "MidiManager.setup()"
              )
            ],
            symbol: "_dispatch_client_callout"
          )
        ]
      )
    ])
    let stall = MainThreadStall(
      phase: "beforeFirstRender",
      startedAt: 0.2,
      duration: 0.645,
      unfinished: false,
      callStackTree: tree
    )
    let record = stall.toLogRecord(timestamp: Date(timeIntervalSince1970: 0))
    let attributes = try #require(record.attributes?.value as? [String: Any])

    #expect(record.name == "app_startup.main_thread_stall")
    #expect(record.severity == .warn)
    #expect(attributes["expo.stall.phase"] as? String == "beforeFirstRender")
    #expect(attributes["expo.stall.duration_ms"] as? Double == 645)
    #expect(attributes["expo.stall.started_at_ms"] as? Double == 200)
    #expect(attributes["expo.stall.unfinished"] as? Bool == false)
    #expect(attributes["expo.stall.rendered_frame_count"] as? Int == 2)
    let stacktrace = try #require(attributes["expo.stall.stacktrace"] as? String)
    #expect(stacktrace == "_dispatch_client_callout (libdispatch.dylib + 16)\nMidiManager.setup() (App + 32)")
    #expect(attributes["expo.stall.binary_uuids"] as? [String] == ["App:B", "libdispatch.dylib:A"])
  }

  @Test
  func `log record without a stack has no stack attributes`() throws {
    let stall = MainThreadStall(
      phase: "beforeInteractive",
      startedAt: 0,
      duration: 0.2,
      unfinished: true,
      callStackTree: nil
    )
    let attributes = try #require(
      stall.toLogRecord(timestamp: .now).attributes?.value as? [String: Any]
    )
    #expect(attributes["expo.stall.stacktrace"] == nil)
    #expect(attributes["expo.stall.unfinished"] as? Bool == true)
  }

  @Test
  func `summary accumulates count, total and longest`() {
    var summary = MainThreadStallSummary()
    summary.add(
      MainThreadStall(phase: "beforeFirstRender", startedAt: 0, duration: 0.2, unfinished: false, callStackTree: nil)
    )
    summary.add(
      MainThreadStall(phase: "beforeFirstRender", startedAt: 1, duration: 0.6, unfinished: false, callStackTree: nil)
    )
    #expect(summary.count == 2)
    #expect(abs(summary.totalDuration - 0.8) < 0.0001)
    #expect(summary.longestDuration == 0.6)
  }

  @Test
  func `params builder attaches stall totals only when there were stalls`() {
    #expect(MetricParamsBuilder.build(mainThreadStalls: MainThreadStallSummary()).isEmpty)
    var summary = MainThreadStallSummary()
    summary.add(
      MainThreadStall(phase: "beforeFirstRender", startedAt: 0, duration: 0.5, unfinished: false, callStackTree: nil)
    )
    let params = MetricParamsBuilder.build(mainThreadStalls: summary)
    #expect(params["expo.startup.mainThreadStalls.count"] as? Int == 1)
    #expect(params["expo.startup.mainThreadStalls.longestDuration"] as? Double == 0.5)
  }

  @Test
  func `tree built from addresses nests outermost first and symbolicates frames of this process`() throws {
    // A function pointer into this test binary and one into libsystem; both resolve through dladdr.
    let inner = UInt64(UInt(bitPattern: unsafeBitCast(getpid as @convention(c) () -> pid_t, to: UnsafeRawPointer.self)))
    let tree = CrashReportSymbolicator.symbolicate(CrashReport.CallStackTree.fromAddresses([inner, inner + 4]))
    let root = try #require(tree.callStacks?.first?.callStackRootFrames?.first)
    #expect(root.address == inner + 4)
    #expect(root.subFrames?.first?.address == inner)
    #expect(root.binaryName?.isEmpty == false)
    #expect(root.binaryUUID?.isEmpty == false)
    #expect(root.subFrames?.first?.symbol == "getpid")
  }

  @Test
  func `monitor reports a stall with a backtrace when the main thread blocks`() async throws {
    let monitor = MainThreadStallMonitor(
      configuration: .init(pingInterval: 0.01, stallThreshold: 0.05, maxMonitoringDuration: 5)
    )
    let stall: MainThreadStall = try await withCheckedThrowingContinuation { continuation in
      // The phase provider flips once the stall has been detected: the stall must keep the value it
      // started in, not the value at the time it ended.
      let phaseFlipped = LockIsolated(false)
      monitor.start(
        anchor: CACurrentMediaTime(),
        phase: {
          defer { phaseFlipped.setValue(true) }
          return phaseFlipped.value ? "afterInteractive" : "beforeFirstRender"
        }
      ) { stall, _ in
        continuation.resume(returning: stall)
      }
      DispatchQueue.main.async {
        Thread.sleep(forTimeInterval: 0.3)
      }
    }
    monitor.stop()
    #expect(stall.duration >= 0.2)
    #expect(stall.unfinished == false)
    #expect(stall.phase == "beforeFirstRender")
    #expect(stall.callStackTree?.callStacks?.first?.callStackRootFrames?.isEmpty == false)
  }
}

private final class LockIsolated<T>: @unchecked Sendable {
  private let lock = NSLock()
  private var storage: T

  init(_ value: T) {
    storage = value
  }

  var value: T {
    lock.lock()
    defer { lock.unlock() }
    return storage
  }

  func setValue(_ value: T) {
    lock.lock()
    storage = value
    lock.unlock()
  }
}
