// Copyright 2025-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("SyncFunctionCallProfiler", .serialized)
@JavaScriptActor
struct SyncFunctionCallProfilerTests {
  private final class Recorder: @unchecked Sendable {
    private let calls = Mutex<[SlowSyncCall]>([])

    func record(_ call: SlowSyncCall) {
      calls.withLock { $0.append(call) }
    }

    /// Only this suite's module: the observer is process-wide and other suites run in parallel.
    var all: [SlowSyncCall] {
      calls.withLock { $0 }.filter { $0.identity.ownerName.hasPrefix("ProfiledModule") }
    }
  }

  let appContext: AppContext
  private let recorder = Recorder()

  init() {
    appContext = AppContext.create()
    appContext.moduleRegistry.register(holder: mockModuleHolder(appContext) {
      Name("ProfiledModule")

      Function("fast") { 1 }

      Function("slow") { (sleepMs: Int) -> Int in
        Thread.sleep(forTimeInterval: Double(sleepMs) / 1000)
        return sleepMs
      }

      Function("slowThrow") { () throws -> Int in
        Thread.sleep(forTimeInterval: 0.02)
        throw GenericException("expected")
      }

      Property("slowProperty") { () -> Int in
        Thread.sleep(forTimeInterval: 0.02)
        return 7
      }

      Class("Counter") {
        Constructor {}

        Function("slowMethod") { () -> Int in
          Thread.sleep(forTimeInterval: 0.02)
          return 3
        }
      }
    })
  }

  private var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  @Test
  func `reports a slow sync function with its qualified identity`() throws {
    SyncFunctionCallProfiler.setObserver(threshold: 0.01) { [recorder] in recorder.record($0) }
    defer { SyncFunctionCallProfiler.removeObserver() }

    #expect(try runtime.eval("expo.modules.ProfiledModule.slow(25)").asInt() == 25)

    let calls = recorder.all
    try #require(calls.count == 1)
    #expect(calls[0].identity == SyncCallIdentity(ownerName: "ProfiledModule", name: "slow", kind: .function))
    #expect(calls[0].identity.qualifiedName == "ProfiledModule.slow")
    #expect(calls[0].duration >= 0.025)
    #expect(calls[0].startedAt > 0)
  }

  @Test
  func `ignores calls under the threshold`() throws {
    SyncFunctionCallProfiler.setObserver(threshold: 0.01) { [recorder] in recorder.record($0) }
    defer { SyncFunctionCallProfiler.removeObserver() }

    #expect(try runtime.eval("expo.modules.ProfiledModule.fast()").asInt() == 1)
    #expect(recorder.all.isEmpty)
  }

  @Test
  func `reports property getters and class methods under their owner`() throws {
    SyncFunctionCallProfiler.setObserver(threshold: 0.01) { [recorder] in recorder.record($0) }
    defer { SyncFunctionCallProfiler.removeObserver() }

    #expect(try runtime.eval("expo.modules.ProfiledModule.slowProperty").asInt() == 7)
    #expect(try runtime.eval("new expo.modules.ProfiledModule.Counter().slowMethod()").asInt() == 3)

    let identities = recorder.all.map(\.identity)
    #expect(identities.contains(SyncCallIdentity(ownerName: "ProfiledModule", name: "slowProperty", kind: .propertyGetter)))
    #expect(identities.contains(SyncCallIdentity(ownerName: "ProfiledModule.Counter", name: "slowMethod", kind: .function)))
  }

  @Test
  func `still reports a call that throws`() throws {
    SyncFunctionCallProfiler.setObserver(threshold: 0.01) { [recorder] in recorder.record($0) }
    defer { SyncFunctionCallProfiler.removeObserver() }

    #expect(throws: (any Error).self) {
      try runtime.eval("expo.modules.ProfiledModule.slowThrow()")
    }
    #expect(recorder.all.map(\.identity.name) == ["slowThrow"])
  }

  @Test
  func `does nothing without an observer`() throws {
    SyncFunctionCallProfiler.removeObserver()
    #expect(try runtime.eval("expo.modules.ProfiledModule.slow(15)").asInt() == 15)
    #expect(recorder.all.isEmpty)
  }
}
