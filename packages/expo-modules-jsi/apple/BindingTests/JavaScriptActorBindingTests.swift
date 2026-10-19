// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation
import Testing
import os

/// Tests that bind `JavaScriptActor` to runtimes on React-like JavaScript threads. Serialized, because
/// the binding is process-wide.
@Suite(.serialized)
struct JavaScriptActorBindingTests {
  private static let actorThreadName = "expo.modules.jsi.JavaScriptActor"

  @Test
  func `async work resumes on the bound runtime's thread`() async throws {
    let reactRuntime = await ReactLikeRuntime(name: "binding.resume")
    JavaScriptActor.bind(to: reactRuntime.runtime)
    defer {
      JavaScriptActor.bind(to: nil)
    }

    let threadNames = try await Task { @JavaScriptActor in
      var names = [currentThreadName()]
      try await Task.sleep(nanoseconds: 1_000_000)
      names.append(currentThreadName())
      await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
        DispatchQueue.global().async {
          continuation.resume()
        }
      }
      names.append(currentThreadName())
      await MainActor.run {}
      names.append(currentThreadName())
      return names
    }.value

    #expect(threadNames == Array(repeating: "binding.resume", count: 4))
    await reactRuntime.release()
  }

  @Test
  func `a blocking execute with an async closure in a host task on the JavaScript thread completes`() async throws {
    // React's scheduler doesn't start a task while another one runs. The jobs of the async closure
    // must reach the JavaScript thread while the host task waits for them.
    let reactRuntime = await ReactLikeRuntime(name: "binding.blocking")
    let runtime = try #require(reactRuntime.runtime)
    JavaScriptActor.bind(to: runtime)
    defer {
      JavaScriptActor.bind(to: nil)
    }

    let result = await withCheckedContinuation { (continuation: CheckedContinuation<Int?, Never>) in
      let resumed = OSAllocatedUnfairLock(initialState: false)
      let resumeOnce: @Sendable (Int?) -> Void = { value in
        if resumed.withLock({ wasResumed in
          defer { wasResumed = true }
          return !wasResumed
        }) {
          continuation.resume(returning: value)
        }
      }
      // A deadlock would never resume the continuation, so the test fails after a timeout instead.
      DispatchQueue.global().asyncAfter(deadline: .now() + 10) {
        resumeOnce(nil)
      }
      reactRuntime.scheduler.schedule {
        let value = try? runtime.execute { @JavaScriptActor () async throws -> Int in
          try await Task.sleep(nanoseconds: 1_000_000)
          return 42
        }
        resumeOnce(value)
      }
    }

    #expect(result == 42)
    await reactRuntime.release()
  }

  @Test
  func `binding another runtime sends the jobs to its thread and unbinding the old one keeps it`() async throws {
    let first = await ReactLikeRuntime(name: "binding.first")
    let second = await ReactLikeRuntime(name: "binding.second")
    defer {
      JavaScriptActor.bind(to: nil)
    }

    JavaScriptActor.bind(to: first.runtime)
    #expect(await Task { @JavaScriptActor in currentThreadName() }.value == "binding.first")

    JavaScriptActor.bind(to: second.runtime)
    #expect(await Task { @JavaScriptActor in currentThreadName() }.value == "binding.second")

    // The old runtime of a reload goes away after the new one is bound.
    JavaScriptActor.unbind(from: try #require(first.runtime))
    #expect(await Task { @JavaScriptActor in currentThreadName() }.value == "binding.second")

    JavaScriptActor.unbind(from: try #require(second.runtime))
    #expect(await Task { @JavaScriptActor in currentThreadName() }.value == Self.actorThreadName)

    await first.release()
    await second.release()
  }

  @Test
  func `a job queued on the old thread before another runtime is bound runs on the new thread`() async throws {
    let old = await ReactLikeRuntime(name: "binding.queued.old")
    let new = await ReactLikeRuntime(name: "binding.queued.new")
    JavaScriptActor.bind(to: old.runtime)
    defer {
      JavaScriptActor.bind(to: nil)
    }

    // Keeps the old thread busy, so the task's first job waits in its run loop.
    let isBusy = DispatchSemaphore(value: 0)
    let release = DispatchSemaphore(value: 0)
    old.thread.perform {
      isBusy.signal()
      release.wait()
    }
    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      DispatchQueue.global().async {
        isBusy.wait()
        continuation.resume()
      }
    }

    let task = Task { @JavaScriptActor in
      currentThreadName()
    }
    // The old thread is still running when the new runtime is bound, as in a reload.
    JavaScriptActor.bind(to: new.runtime)
    release.signal()

    #expect(await task.value == "binding.queued.new")
    await old.release()
    await new.release()
  }

  @Test
  func `a job sent to a stopped JavaScript thread runs on the thread bound next`() async throws {
    let old = await ReactLikeRuntime(name: "binding.old")
    let new = await ReactLikeRuntime(name: "binding.new")
    JavaScriptActor.bind(to: old.runtime)
    defer {
      JavaScriptActor.bind(to: nil)
    }

    let continuationBox = ContinuationBox()
    let task = Task { @JavaScriptActor in
      await withCheckedContinuation { continuation in
        continuationBox.set(continuation)
      }
      return currentThreadName()
    }
    await continuationBox.waitUntilSet()

    // The React instance goes away: its runtime is released and its JavaScript thread stops, while
    // the runtime is still bound.
    await old.release()
    old.thread.stop()

    // The job goes to the stopped thread's run loop, which never runs it.
    continuationBox.resume()

    // Binding the new runtime releases the last reference to the old run loop, which releases the job.
    JavaScriptActor.bind(to: new.runtime)

    #expect(await task.value == "binding.new")
    await new.release()
  }
}

/// Holds a continuation that one task waits on and the test resumes.
private final class ContinuationBox: @unchecked Sendable {
  private let condition = NSCondition()
  private var continuation: CheckedContinuation<Void, Never>?

  func set(_ continuation: CheckedContinuation<Void, Never>) {
    condition.withLock {
      self.continuation = continuation
      condition.broadcast()
    }
  }

  func waitUntilSet() async {
    await withCheckedContinuation { (done: CheckedContinuation<Void, Never>) in
      DispatchQueue.global().async { [self] in
        condition.withLock {
          while continuation == nil {
            condition.wait()
          }
        }
        done.resume()
      }
    }
  }

  func resume() {
    condition.withLock {
      continuation?.resume()
      continuation = nil
    }
  }
}
