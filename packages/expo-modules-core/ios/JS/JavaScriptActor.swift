///**
// Global actor that is used to isolate the code that should only be executed from the JavaScript thread.
// Theoretically it does not act as a real actor; it uses a serial executor that executes jobs **synchronously**
// without hopping to the proper thread. Meaning that running these jobs on the JavaScript thread must be ensured
// externally before switching to the isolated context, e.g. using `schedule` function on `JavaScriptRuntime`
// or enforcing the isolation with `JavaScriptActor.assumeIsolated`.
// */
//@globalActor
//public actor JavaScriptActor: GlobalActor {
//  public static let shared = JavaScriptActor()
//
//  private init() {}
//
//  nonisolated private let executor = JavaScriptSerialExecutor()
//
//  nonisolated public var unownedExecutor: UnownedSerialExecutor {
//    return executor.asUnownedSerialExecutor()
//  }
//
//  /**
//   An equivalent of `MainActor.assumeIsolated`, but for the `JavaScriptActor`. Assumes that the currently executing
//   synchronous function is actually executing on the JavaScript thread and invokes an isolated version of the operation,
//   allowing synchronous access to JavaScript runtime state without hopping through asynchronous boundaries.
//
//   See https://stackoverflow.com/a/79346971 for more information about the implementation.
//   */
//  public static func assumeIsolated<T: ~Copyable>(_ operation: @JavaScriptActor () throws -> T) rethrows -> T {
//    typealias YesActor = @JavaScriptActor () throws -> T
//    typealias NoActor = () throws -> T
//
//    // This will crash if the current context cannot be isolated.
//    shared.executor.checkIsolated()
//
//    // To do the unsafe cast, we have to pretend it's @escaping.
//    return try withoutActuallyEscaping(operation) { (_ fn: @escaping YesActor) throws -> T in
//      let rawFn = unsafeBitCast(fn, to: NoActor.self)
//      return try rawFn()
//    }
//  }
//}
//
///**
// Name of the JavaScript thread created by React Native. Copied from `RCTJSThreadManager.mm`.
// */
//private let jsThreadName = "com.facebook.react.runtime.JavaScript"
//
///**
// Executor for the `JavaScriptActor` that executes given jobs synchronously and immediately.
// - Note: It does not ensure that given jobs are executed on the JavaScript thread; it must be done externally.
// */
//private final class JavaScriptSerialExecutor: SerialExecutor {
//  func enqueue(_ job: UnownedJob) {
//    job.runSynchronously(on: self.asUnownedSerialExecutor())
//  }
//
//  /**
//   Converts the executor to the optimized form of borrowed executor reference.
//   */
//  func asUnownedSerialExecutor() -> UnownedSerialExecutor {
//    return UnownedSerialExecutor(ordinary: self)
//  }
//
//  /**
//   Stops program execution if the executor is not isolating the current context.
//   */
//  func checkIsolated() {
//    precondition(isIsolatingCurrentContext() == true, "JavaScriptActor operations must be run on the JavaScript thread")
//  }
//
//  /**
//   Checks whether the executor isolates the current context, i.e. the current thread is a JavaScript thread.
//   The condition is also met when running tests and in single threaded environments.
//   */
//  func isIsolatingCurrentContext() -> Bool? {
//    // We must be careful as it relies on the thread name given by React Native.
//    return Thread.current.name == jsThreadName || !Thread.isMultiThreaded() || ProcessInfo.processInfo.processName == "xctest"
//  }
//}
