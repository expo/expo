internal import ExpoModulesJSI_Cxx
import Foundation
import os

/// Global actor that isolates the code that must run on the JavaScript thread.
///
/// It is a real actor: its executor runs every job on the JavaScript thread of the runtime bound with
/// ``bind(to:)``, so asynchronous `@JavaScriptActor` code comes back to that thread after each
/// suspension point, also after a hop to another actor such as the main actor. Until a runtime is
/// bound, the actor runs its jobs on a thread of its own.
///
/// Synchronous entry from code that already runs on a JavaScript thread, such as host functions,
/// uses `JavaScriptActor.assumeIsolated` and does not hop.
///
/// Only the bound runtime gets asynchronous `@JavaScriptActor` work. Other runtimes, such as the
/// worklet UI runtime, can be used synchronously on their own thread.
@globalActor
public actor JavaScriptActor: GlobalActor {
  public static let shared = JavaScriptActor()

  private init() {}

  nonisolated public var unownedExecutor: UnownedSerialExecutor {
    return JavaScriptExecutor.shared.asUnownedSerialExecutor()
  }

  /// Makes the actor run its jobs on the runtime's JavaScript thread. The host calls it when it
  /// creates the main runtime, and again for the new runtime after a reload. Passing `nil` goes back
  /// to the actor's own thread.
  ///
  /// The runtime must have a host scheduler, and the thread that created it must run its run loop,
  /// like React Native's JavaScript thread does: the actor sends its jobs through that run loop.
  public static func bind(to runtime: JavaScriptRuntime?) {
    if let runtime {
      assert(
        runtime.supportsAsyncScheduling,
        "JavaScriptActor can only be bound to a runtime with a host scheduler, whose JavaScript thread runs its run loop"
      )
    }
    JavaScriptExecutor.shared.bind(runtime?.scheduler.executorTarget)
  }

  /// Sends the actor back to its own thread if the runtime is still the bound one. The host calls it
  /// when the runtime goes away. Does nothing when another runtime has been bound since, for example
  /// when the old runtime of a reload goes away after the new one is bound.
  public static func unbind(from runtime: JavaScriptRuntime) {
    JavaScriptExecutor.shared.unbind(runtime.scheduler.executorTarget)
  }

  /// An equivalent of `MainActor.assumeIsolated`, but for the `JavaScriptActor`. Assumes that the currently executing
  /// synchronous function is actually executing on the JavaScript thread and invokes an isolated version of the operation,
  /// allowing synchronous access to JavaScript runtime state without hopping through asynchronous boundaries.
  /// The nonthrowing overload keeps `operation` nonescaping so its captured context can remain stack-allocated.
  @_alwaysEmitIntoClient
  @inline(__always)
  public static func assumeIsolated<T: ~Copyable>(_ operation: @JavaScriptActor () -> T) -> T {
    typealias IsolatedRunner = @JavaScriptActor (@JavaScriptActor () -> T) -> T
    typealias NonisolatedRunner = (@JavaScriptActor () -> T) -> T

    // This will crash if the current context cannot be isolated.
    checkIsolated()

    // Cast the capture-free runner rather than `operation` itself. `operation` remains nonescaping,
    // so its captures can stay in the caller's stack frame.
    let runner = unsafeBitCast(runIsolated as IsolatedRunner, to: NonisolatedRunner.self)
    return runner(operation)
  }

  /// Throwing counterpart to the nonthrowing overload above. The generic error type keeps
  /// `operation` nonescaping while preserving the exact error it can throw.
  @_alwaysEmitIntoClient
  @inline(__always)
  public static func assumeIsolated<T: ~Copyable, E: Error>(
    _ operation: @JavaScriptActor () throws(E) -> T
  ) throws(E) -> T {
    // Casting a `throws(E)` function value requires newer OS runtime support. Wrapping the
    // operation in the nonthrowing fast path keeps this backdeployable and stack-allocated.
    let result: Result<T, E> = assumeIsolated {
      return Result(catching: operation)
    }
    return try result.get()
  }

  /// In debug builds, asserts if the actor's executor is not isolating the current context.
  @inlinable
  @inline(__always)
  public static func checkIsolated() {
    // Using `assert` instead of `precondition` because this check is a heuristic based on
    // thread name, not a precise isolation guarantee. Worklet runtimes legitimately run on
    // the UI thread, which would cause a false-positive crash with `precondition`.
    assert(
      // JavaScript thread name copied from `RCTJSThreadManager.mm`.
      Thread.current.name == "com.facebook.react.runtime.JavaScript" || !Thread.isMultiThreaded()
        || ProcessInfo.processInfo.processName == "xctest",
      "JavaScriptActor operations must be run on the JavaScript thread"
    )
  }

  @JavaScriptActor
  @usableFromInline
  internal static func runIsolated<T: ~Copyable>(_ operation: @JavaScriptActor () -> T) -> T {
    return operation()
  }
}

/// Serial executor of the `JavaScriptActor`. Runs every job on the JavaScript thread of the bound
/// runtime, or on a thread of its own while none is bound.
///
/// The executor is one object for the whole process, so `JavaScriptActor.unownedExecutor` is
/// stable, as Swift requires. Only the thread it delivers jobs to changes, when the host binds a
/// new runtime: React Native creates a new JavaScript thread for each React instance.
///
/// Jobs go through the target thread's run loop, not through the host's scheduler. React's scheduler
/// doesn't start a task while another one runs, so a job sent through it would never run while a
/// task on the JavaScript thread waits for it, for example in a blocking `execute` with an async
/// closure.
///
/// A job is a suspended task, and there is no way to throw into it, so the executor never drops a
/// job: a task whose job is dropped never resumes. When the JavaScript thread stops before it runs a
/// job (the React instance is gone), the job goes to the current target instead, where runtime work
/// of the old runtime fails its liveness checks.
internal final class JavaScriptExecutor: SerialExecutor, @unchecked Sendable {
  /// Where jobs go while a runtime is bound: its thread's run loop. After each job, the runtime's
  /// microtasks are drained, as React's scheduler does after each task.
  internal final class Target: @unchecked Sendable {
    let threadID: UInt64
    let runLoop: CFRunLoop
    /// The handle rather than the runtime, which owns its target.
    let handle: JavaScriptRuntimeHandle?
    /// Where the errors of the microtasks that the jobs run go, see `expo.drainMicrotasks`.
    let hostScheduler: expo.RuntimeScheduler?

    init(
      threadID: UInt64,
      runLoop: CFRunLoop,
      handle: JavaScriptRuntimeHandle?,
      hostScheduler: expo.RuntimeScheduler?
    ) {
      self.threadID = threadID
      self.runLoop = runLoop
      self.handle = handle
      self.hostScheduler = hostScheduler
    }
  }

  internal static let shared = JavaScriptExecutor()

  private let boundTarget = OSAllocatedUnfairLock<Target?>(initialState: nil)

  /// The thread that runs jobs while no runtime is bound. Started on first use.
  private static let ownTarget: Target = JavaScriptActorThread.start()

  private init() {}

  internal func bind(_ target: Target?) {
    let previous = boundTarget.withLock { bound -> Target? in
      defer {
        bound = target
      }
      return bound
    }
    // Released outside the lock: when it's the last reference to a stopped thread's run loop, the
    // run loop releases the jobs it never ran, which enqueue themselves again.
    _ = previous
  }

  internal func unbind(_ target: Target) {
    let previous = boundTarget.withLock { bound -> Target? in
      guard bound === target else {
        return nil
      }
      defer {
        bound = nil
      }
      return bound
    }
    _ = previous
  }

  /// Where jobs go now.
  internal var target: Target {
    return boundTarget.withLock { $0 } ?? Self.ownTarget
  }

  // MARK: - SerialExecutor

  func enqueue(_ job: UnownedJob) {
    let target = self.target
    let delivery = JobDelivery(job, executor: asUnownedSerialExecutor(), target: target)

    CFRunLoopPerformBlock(target.runLoop, CFRunLoopMode.commonModes.rawValue) {
      delivery.run()
    }
    CFRunLoopWakeUp(target.runLoop)
  }

  /// Converts the executor to the optimized form of borrowed executor reference.
  func asUnownedSerialExecutor() -> UnownedSerialExecutor {
    return UnownedSerialExecutor(ordinary: self)
  }

  /// Whether the current thread is the one this executor delivers jobs to.
  @inline(__always)
  internal func isOnTargetThread() -> Bool {
    let current = Self.currentThreadID()
    return current == target.threadID
  }

  /// Lets Swift 6.2 runtimes ask, without crashing, whether the current context is isolated.
  /// Returns `nil` instead of `false` off the target thread, so the runtime falls back to
  /// ``checkIsolated()``: other runtimes, such as the worklet UI runtime, run synchronous
  /// `@JavaScriptActor` code on their own thread through `assumeIsolated`.
  func isIsolatingCurrentContext() -> Bool? {
    return isOnTargetThread() ? true : nil
  }

  /// Runtime hook used by Swift's actor data-race checks for synchronous entry into
  /// `@JavaScriptActor` code. Do not remove: the `SerialExecutor` default always fails
  /// when there is no active Swift task carrying this executor.
  func checkIsolated() {
    if isOnTargetThread() {
      return
    }
    JavaScriptActor.checkIsolated()
  }

  // MARK: - Helpers

  @inline(__always)
  internal static func currentThreadID() -> UInt64 {
    var current: UInt64 = 0
    pthread_threadid_np(nil, &current)
    return current
  }
}

/// Runs a job on the target's run loop, then drains the runtime's microtasks. When the run loop is
/// released without running it (the JavaScript thread has stopped), `deinit` enqueues the job again,
/// to the current target, so the task still resumes and its jobs stay serial. The old runtime is gone
/// then, so its runtime work in the job fails its liveness checks.
private final class JobDelivery: @unchecked Sendable {
  private let job: UnownedJob
  private let executor: UnownedSerialExecutor
  /// Weak: the target holds the run loop, which holds this delivery until it runs or releases it.
  private weak var target: JavaScriptExecutor.Target?
  private var didRun = false

  init(_ job: UnownedJob, executor: UnownedSerialExecutor, target: JavaScriptExecutor.Target) {
    self.job = job
    self.executor = executor
    self.target = target
  }

  func run() {
    didRun = true
    // A job sent before the host bound another runtime, or unbound this one, goes to the target bound
    // now, so that the actor's jobs don't run on two threads at once.
    guard let target, target === JavaScriptExecutor.shared.target else {
      JavaScriptExecutor.shared.enqueue(job)
      return
    }
    job.runSynchronously(on: executor)

    if !expo.isInNestedRunLoopWait(), let runtime = target.handle?.pointee, let hostScheduler = target.hostScheduler,
      !expo.drainMicrotasks(runtime, hostScheduler)
    {
      Logger(subsystem: "expo.modules.jsi", category: "JavaScriptActor").error(
        "Stopped draining the microtasks after a JavaScriptActor job: they kept throwing errors."
      )
    }
  }

  deinit {
    if !didRun {
      JavaScriptExecutor.shared.enqueue(job)
    }
  }
}

/// The executor's own thread, for jobs while no runtime is bound. Runs its run loop like React
/// Native's JavaScript thread does.
private enum JavaScriptActorThread {
  static func start() -> JavaScriptExecutor.Target {
    let ready = DispatchSemaphore(value: 0)
    let target = NonisolatedUnsafeVar<JavaScriptExecutor.Target>()
    let thread = Thread {
      target.value = JavaScriptExecutor.Target(
        threadID: JavaScriptExecutor.currentThreadID(),
        runLoop: CFRunLoopGetCurrent(),
        handle: nil,
        hostScheduler: nil
      )
      // A source that never fires keeps the run loop from returning when it has no work.
      var context = CFRunLoopSourceContext()
      let source = CFRunLoopSourceCreate(nil, 0, &context)
      CFRunLoopAddSource(CFRunLoopGetCurrent(), source, .defaultMode)
      ready.signal()
      while true {
        CFRunLoopRunInMode(.defaultMode, .greatestFiniteMagnitude, false)
      }
    }
    thread.name = "expo.modules.jsi.JavaScriptActor"
    // Default QoS on purpose: code on this thread may block on default-QoS threads (tests do), and
    // a higher QoS makes that a priority inversion.
    thread.start()
    ready.wait()
    return target.value!
  }
}
