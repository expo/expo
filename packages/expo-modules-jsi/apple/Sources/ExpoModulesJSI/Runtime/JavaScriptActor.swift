import Foundation

/// Global actor that is used to isolate the code that should only be executed from the JavaScript thread.
/// Theoretically it does not act as a real actor; it uses a serial executor that executes jobs **synchronously**
/// without hopping to the proper thread. Meaning that running these jobs on the JavaScript thread must be ensured
/// externally before switching to the isolated context, e.g. using `schedule` function on `JavaScriptRuntime`
/// or enforcing the isolation with `JavaScriptActor.assumeIsolated`.
@globalActor
public actor JavaScriptActor: GlobalActor {
  public static let shared = JavaScriptActor()

  private init() {}

  nonisolated private let executor = JavaScriptExecutor()

  nonisolated public var unownedExecutor: UnownedSerialExecutor {
    return executor.asUnownedSerialExecutor()
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

/// Executor for the `JavaScriptActor` that executes given jobs synchronously and immediately.
/// - Note: It does not ensure that given jobs are executed on the JavaScript thread; it must be done externally.
internal class JavaScriptExecutor: SerialExecutor, @unchecked Sendable {
  func enqueue(_ job: UnownedJob) {
    job.runSynchronously(on: self.asUnownedSerialExecutor())
  }

  /// Converts the executor to the optimized form of borrowed executor reference.
  func asUnownedSerialExecutor() -> UnownedSerialExecutor {
    return UnownedSerialExecutor(ordinary: self)
  }

  /// Runtime hook used by Swift's actor data-race checks for synchronous entry into
  /// `@JavaScriptActor` code. Do not remove: the `SerialExecutor` default always fails
  /// when there is no active Swift task carrying this executor.
  func checkIsolated() {
    JavaScriptActor.checkIsolated()
  }
}

/// An actor that is dedicated for the specific runtime.
internal actor JavaScriptRuntimeActor {
  private weak let runtime: JavaScriptRuntime?
  nonisolated private let executor: JavaScriptExecutor

  init(runtime: JavaScriptRuntime) {
    self.runtime = runtime
    self.executor = JavaScriptRuntimeExecutor(runtime: runtime)
  }

  nonisolated var unownedExecutor: UnownedSerialExecutor {
    return executor.asUnownedSerialExecutor()
  }

  func execute<R: Sendable>(_ operation: @escaping @JavaScriptActor () async throws -> R) async rethrows -> sending R {
    return try await operation()
  }
}

/// Serial executor dedicated for the specific runtime.
internal final class JavaScriptRuntimeExecutor: JavaScriptExecutor, @unchecked Sendable {
  private weak let runtime: JavaScriptRuntime?

  init(runtime: JavaScriptRuntime) {
    self.runtime = runtime
  }

  override func enqueue(_ job: UnownedJob) {
    runtime?.schedule(priority: .immediate) {
      job.runSynchronously(on: self.asUnownedSerialExecutor())
    }
  }
}
