// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

internal import jsi
internal import ExpoModulesJSI_Cxx

/**
 A Swift wrapper around a JavaScript runtime. Provides access to a JavaScript execution environment, allowing you to evaluate
 JavaScript code, create and manipulate JavaScript objects, functions, and values, and bridge between Swift and JavaScript.

 ## Threading

 JavaScript runtimes are single-threaded. All operations must be performed on the JavaScript
 thread. Use `schedule()` or `execute()` methods to safely run code on the correct thread.
 The runtime uses `@JavaScriptActor` to enforce thread safety at compile time.

 ## Lifecycle

 The runtime maintains a weak reference pattern for values, objects, and arrays to prevent
 retain cycles. Ensure the runtime remains alive while any derived JavaScript objects are in use.
 */
open class JavaScriptRuntime: Equatable, @unchecked Sendable {
  /**
   The underlying JSI runtime this `JavaScriptRuntime` points to, exposed as
   `IRuntime` — the abstract base interface that virtually all JSI value/object/
   function methods take (`Value::getString`, `Object::setProperty`,
   `Function::call`, …) since RN 0.86 split the API. Stored as the upcast result
   of `runtimePointee` because Swift's C++ interop does not auto-upcast between
   two `SwiftImportAs: reference` types.

   Use ``runtimePointee`` instead when you specifically need a `jsi::Runtime&`
   (e.g. constructing an `expo.RuntimeScheduler` whose binding lookup is typed on
   `Runtime&` upstream).

   Note that `facebook.jsi.IRuntime` and `facebook.jsi.Runtime` are imported as
   reference types so for the Swift compiler they are treated like classes.
   This is important because they:
   - are abstract classes with many virtual methods. Swift/C++ interop does not support calling pure virtual methods on value types.
   - are non-copyable. As value types, we would have to "borrow" them from React Native in an unsafe manner.
   */
  internal let pointee: facebook.jsi.IRuntime
  internal let runtimePointee: facebook.jsi.Runtime
  internal let scheduler: expo.RuntimeScheduler

  /**
   Actor for running runtime work.
   */
  lazy var runtimeActor: JavaScriptRuntimeActor = JavaScriptRuntimeActor(runtime: self)

  /**
   Creates a runtime from the JSI runtime. The scheduler runs tasks synchronously
   on the caller's thread — for the React-backed runtime, use
   `init(unsafePointer:nativeScheduler:dispatch:)` instead.
   */
  internal init(_ runtime: facebook.jsi.Runtime) {
    self.runtimePointee = runtime
    self.pointee = expo.iruntime(runtime)
    self.scheduler = expo.RuntimeScheduler()
  }

  /**
   Creates a standalone Hermes runtime. Scheduled tasks run synchronously —
   no React scheduler is wired up.
   */
  public init() {
    let runtime = expo.createHermesRuntime()
    self.runtimePointee = runtime
    self.pointee = expo.iruntime(runtime)
    self.scheduler = expo.RuntimeScheduler()
  }

  /**
   Creates a runtime from a raw pointer to the underlying `facebook.jsi.Runtime`.
   Scheduled tasks run synchronously — for the React-backed runtime, use
   `init(unsafePointer:nativeScheduler:dispatch:)` instead.
   */
  public init(unsafePointer: UnsafeMutableRawPointer) {
    let runtime = unsafeBitCast(unsafePointer, to: facebook.jsi.Runtime.self)
    self.runtimePointee = runtime
    self.pointee = expo.iruntime(runtime)
    self.scheduler = expo.RuntimeScheduler()
  }

  /**
   Creates a runtime bound to a host-provided React `RuntimeScheduler`. Calls to
   `schedule(...)` / `.execute(...)` dispatch through `dispatch`, which the host
   implements against the real `react::RuntimeScheduler`. This is the path the
   React Native factory uses.

   - `unsafePointer`: raw pointer to the underlying `facebook::jsi::Runtime`.
   - `scheduler`: raw pointer to the `react::RuntimeScheduler` instance.
   - `dispatch`: raw pointer to a C function with signature
     `void (*)(void *scheduler, int priority, void (^callback)())`.
   */
  public init(
    unsafePointer: UnsafeMutableRawPointer,
    scheduler: UnsafeMutableRawPointer,
    dispatch: UnsafeRawPointer
  ) {
    let runtime = unsafeBitCast(unsafePointer, to: facebook.jsi.Runtime.self)
    let fn = unsafeBitCast(dispatch, to: expo.RuntimeScheduler.ScheduleFn.self)
    self.runtimePointee = runtime
    self.pointee = expo.iruntime(runtime)
    self.scheduler = expo.RuntimeScheduler(scheduler, fn)
  }

  /**
   Provides scoped access to a raw pointer to the underlying `facebook.jsi.Runtime`.
   The pointer is valid only for the duration of the closure and must not be stored or escaped.
   */
  public func withUnsafePointee<R>(_ body: (UnsafeMutableRawPointer) throws -> R) rethrows -> R {
    return try body(Unmanaged<facebook.jsi.Runtime>.passUnretained(runtimePointee).toOpaque())
  }

  /**
   Returns the runtime `global` object.
   */
  public func global() -> JavaScriptObject {
    return JavaScriptObject(self, pointee.global())
  }

  // MARK: - Creating objects

  /**
   Creates a plain JavaScript object.
   */
  public func createObject() -> JavaScriptObject {
    return JavaScriptObject(self, facebook.jsi.Object(pointee))
  }

  /**
   Creates a new JavaScript object, using the provided object as the prototype.
   Calls `Object.create(prototype)` under the hood.
   */
  public func createObject(prototype: borrowing JavaScriptObject) -> JavaScriptObject {
    return try! global()
      .getPropertyAsObject("Object")
      .getPropertyAsFunction("create")
      .call(arguments: prototype.refToValue())
      .getObject()
  }

  /**
   Creates a JavaScript host object with given implementations for property getter, property setter, property names getter and dealloc.

   Errors thrown from `get` or `set` propagate to JavaScript as a thrown `Error`. Conform
   the thrown type to `JavaScriptThrowable` to control the resulting `message` and `code`.

   Pass `nil` for `set` to make the host object read-only — assignment from JavaScript
   then throws an `Error` whose message names the property and explains how to make it
   writable. `getPropertyNames` and `dealloc` default to no-ops.
   */
  public func createHostObject(
    get: @escaping @JavaScriptActor (_ propertyName: String) throws -> JavaScriptValue,
    set: (@JavaScriptActor (_ propertyName: String, _ value: JavaScriptValue) throws -> Void)? = nil,
    getPropertyNames: @escaping @JavaScriptActor () -> [String] = { [] },
    dealloc: @escaping @JavaScriptActor () -> Void = {}
  ) -> JavaScriptObject {
    func getter(context: UnsafeMutableRawPointer, propertyName: UnsafePointer<CChar>) -> facebook.jsi.Value {
      let context = Unmanaged<HostObjectContext>.fromOpaque(context).takeUnretainedValue()
      let propertyName = String(cString: propertyName)

      guard let runtime = context.runtime else {
        FatalError.runtimeLost()
      }
      return JavaScriptActor.assumeIsolated {
        return forwardingSwiftErrorsToJS(runtime: runtime) {
          return try context.get(propertyName).asJSIValue()
        }
      }
    }

    func setter(context: UnsafeMutableRawPointer, propertyName: UnsafePointer<CChar>, valuePointer: UnsafeMutableRawPointer) {
      let context = Unmanaged<HostObjectContext>.fromOpaque(context).takeUnretainedValue()

      guard let runtime = context.runtime else {
        FatalError.runtimeLost()
      }
      guard let set = context.set else {
        // Unreachable in practice: when the user passed `nil` for `set`, the call site
        // below at `expo.HostObjectCallbacks(...)` also passes `nil` to C++, and
        // `HostObjectCallbacks::set` throws a `jsi::JSError` directly instead of
        // calling back into Swift. Trap loudly so a future C++ refactor can't silently
        // swallow assignments.
        FatalError.readOnlyHostObjectSetterInvoked()
      }
      let value = JavaScriptValue(runtime, valuePointer.assumingMemoryBound(to: facebook.jsi.Value.self).move())
      let propertyName = String(cString: propertyName)

      JavaScriptActor.assumeIsolated {
        forwardingSwiftErrorsToJS(runtime: runtime) {
          try set(propertyName, value)
        }
      }
    }

    func propertyNamesGetter(context: UnsafeMutableRawPointer) -> expo.HostObjectCallbacks.PropNameIds {
      let context = Unmanaged<HostObjectContext>.fromOpaque(context).takeUnretainedValue()

      guard let runtime = context.runtime else {
        FatalError.runtimeLost()
      }
      // Get property names within the actor isolation, but build the vector outside
      // to avoid returning a non-copyable C++ type through `assumeIsolated`
      // (its `withoutActuallyEscaping` forces a copy of the return value).
      let propertyNames: [String] = JavaScriptActor.assumeIsolated {
        return context.getPropertyNames()
      }
      var vector = expo.HostObjectCallbacks.PropNameIds()

      vector.reserve(propertyNames.count)

      for propertyName in propertyNames {
        let propNameId = facebook.jsi.PropNameID.forUtf8(runtime.pointee, std.string(propertyName))
        vector.push_back(consuming: propNameId)
      }
      return vector
    }

    func deallocate(context: UnsafeMutableRawPointer) {
      let context = Unmanaged<HostObjectContext>.fromOpaque(context).takeRetainedValue()
      JavaScriptActor.assumeIsolated {
        context.dealloc()
      }
    }

    let context = Unmanaged.passRetained(HostObjectContext(runtime: self, get, set, getPropertyNames, dealloc)).toOpaque()
    // Pass a null setter to C++ when the Swift setter is nil so that JS assignment
    // raises a `jsi::JSError` directly, without crossing the Swift boundary.
    let callbacks = expo.HostObjectCallbacks(context, getter, set == nil ? nil : setter, propertyNamesGetter, deallocate)
    let hostObject = expo.HostObject.makeObject(pointee, consume callbacks)

    return JavaScriptObject(self, hostObject)
  }

  // MARK: - Creating array buffers

  /**
   Creates a new array buffer of the given size with zero-initialized memory.
   */
  public func createArrayBuffer(size: Int) -> JavaScriptArrayBuffer {
    let jsiArrayBuffer = expo.createArrayBuffer(pointee, size)
    return JavaScriptArrayBuffer(self, jsiArrayBuffer)
  }

  /**
   Creates a new array buffer that wraps the given native data pointer.
   The cleanup closure is called when the array buffer is garbage collected.
   */
  public func createArrayBuffer(data: UnsafeMutablePointer<UInt8>, size: Int, cleanup: @escaping @Sendable () -> Void) -> JavaScriptArrayBuffer {
    let context = Unmanaged.passRetained(CleanupContext(cleanup)).toOpaque()
    let jsiArrayBuffer = expo.createArrayBuffer(pointee, data, size, context) { context in
      Unmanaged<CleanupContext>.fromOpaque(context).release()
    }
    return JavaScriptArrayBuffer(self, jsiArrayBuffer)
  }

  // MARK: - Creating arrays

  /**
   Creates a new Array instance.
   */
  public func createArray(length: Int = 0) -> JavaScriptArray {
    return JavaScriptArray(self, facebook.jsi.Array(pointee, length))
  }

  // MARK: - Creating functions

  /**
   Type of the closure that is passed to the `createFunction` function.
   */
  public typealias SyncFunctionClosure = @JavaScriptActor (
    _ this: JavaScriptValue,
    _ arguments: consuming JavaScriptValuesBuffer
  ) throws -> JavaScriptValue

  /**
   Creates a class with the given name and native constructor.
   */
  @JavaScriptActor
  public func createClass(name: String, inheriting baseClass: consuming JavaScriptFunction? = nil, _ constructor: @escaping SyncFunctionClosure) throws -> JavaScriptFunction {
    // Host functions are not standard functions, thus cannot be used as class constructors.
    // We're creating one by evaluating a script that calls a "native constructor" that is a host function.
    let nativeConstructorKey = "__native_constructor__"

    // Validate that the name is a valid JS identifier to prevent code injection via eval.
    if name.wholeMatch(of: /^[a-zA-Z_$][a-zA-Z0-9_$]*$/) == nil {
      throw InvalidIdentifierError(identifier: name)
    }

    let klassValue = try eval(label: "\(name).\(nativeConstructorKey)", "(function \(name)(...args) { return this.\(nativeConstructorKey)(...args); })")
    let klassObject = klassValue.getObject()

    // Create a host function that is called by the constructor
    let nativeConstructor = createFunction(name) { this, arguments in
      return try constructor(this, arguments)
    }

    // Set native constructor as read-only, non-configurable, non-enumerable, non-writable property.
    let prototype = klassObject.getPropertyAsObject("prototype")
    prototype.defineProperty(nativeConstructorKey, value: nativeConstructor)

    // If the base class is provided, set the inherited prototype.
    if let baseClass = baseClass?.asObject() {
      // Inherit instance properties
      prototype.setPrototype(baseClass.getProperty("prototype"))
      // Inherit static properties
      klassObject.setPrototype(baseClass.asValue())
    }

    // Return the constructor function
    return klassValue.getFunction()
  }

  /**
   Creates a synchronous host function that runs the given closure when it's called.
   The value returned by the closure is synchronously returned to JS.
   - Returns: A JavaScript function represented as a `JavaScriptFunction`.
   */
  @JavaScriptActor
  public func createFunction(_ name: String, _ function: sending @escaping SyncFunctionClosure) -> JavaScriptFunction {
    let closure = createFunctionClosure(runtime: self, name: name, function)
    let hostFunction = expo.createHostFunction(pointee, name, closure)

    return JavaScriptFunction(self, hostFunction)
  }

  /**
   Creates a synchronous anonymous host function that runs the given closure when it's called.
   The value returned by the closure is synchronously returned to JS.
   - Returns: A JavaScript function represented as a `JavaScriptFunction`.
   */
  @JavaScriptActor
  public func createFunction(_ function: sending @escaping SyncFunctionClosure) -> JavaScriptFunction {
    let closure = createFunctionClosure(runtime: self, name: nil, function)
    let hostFunction = expo.createHostFunction(pointee, JavaScriptPropNameID.cached(self, "").pointee, closure)

    return JavaScriptFunction(self, hostFunction)
  }

  /**
   Type of the closure that is passed to the `createAsyncFunction` function.
   It is invoked from asynchronous context, so it can await and call other asynchronous functions.
   */
  public typealias AsyncFunctionClosure = @JavaScriptActor (
    _ this: JavaScriptValue,
    _ arguments: consuming JavaScriptValuesBuffer,
  ) async throws -> JavaScriptValue

  /**
   Creates an asynchronous host function that runs given block when it's called.
   The value returned by the closure is returned to JS asynchronously.
   - Returns: A JavaScript function represented as a `JavaScriptFunction` that returns a promise.
   */
  @JavaScriptActor
  public func createAsyncFunction(_ name: String, _ function: sending @escaping AsyncFunctionClosure) -> JavaScriptFunction {
    return createFunction(name) { this, arguments in
      let promise = JavaScriptPromise(self)

      // Arguments buffer needs to be copied to ensure safe async access.
      let argumentsRef = arguments.copy().ref()

      // Switch to asynchronous context.
      self.schedule(taskName: "[JS] Async function \(name)") {
        // Invoke the asynchronous function and resolve/reject the promise.
        do {
          let result = try await function(this, argumentsRef.take())
          promise.resolve(result)
        } catch {
          promise.reject(error)
        }
      }

      // Always return a promise in async functions
      return promise.asValue()
    }
  }

  // MARK: - Runtime execution

  /**
   Whether the runtime scheduler can dispatch work asynchronously to the JS thread.
   Returns false for standalone runtimes (e.g. in tests) where scheduled tasks run synchronously.
   */
  public var supportsAsyncScheduling: Bool {
    return scheduler.supportsAsyncScheduling()
  }

  /**
   Schedules a closure to be executed with granted synchronized access to the runtime.
   */
  public func schedule(priority: SchedulerPriority = .normal, @_implicitSelfCapture _ closure: @escaping @JavaScriptActor () -> sending Void) -> Void {
    let cxxPriority = expo.RuntimeScheduler.Priority(rawValue: priority.rawValue) ?? .NormalPriority
    scheduler.scheduleTask(cxxPriority) {
      JavaScriptActor.assumeIsolated(closure)
    }
  }

  public func schedule(
    priority: SchedulerPriority = .normal,
    taskName: String? = "[JS] runtime.schedule (\(#function))",
    @_implicitSelfCapture _ closure: @escaping @JavaScriptActor () async throws -> Void
  ) -> Void {
    schedule(priority: priority) {
      Task.immediate_polyfill(name: taskName) {
        try await closure()
      }
    }
  }

  /**
   Synchronously executes a closure on the JavaScript runtime thread, blocking the current thread until completion.
   Not available in async contexts to prevent blocking the cooperative thread pool.
   */
  @available(*, noasync)
  public func execute<R: Sendable>(@_implicitSelfCapture _ closure: @escaping @JavaScriptActor () throws -> R) throws -> sending R {
    var result: Result<R, any Error>!

    scheduler.scheduleTask(.ImmediatePriority) {
      do {
        result = .success(try JavaScriptActor.assumeIsolated(closure))
      } catch {
        result = .failure(error)
      }
    }

    // Use RunLoop to wait for the task to finish. As opposed to DispatchSemaphore or DispatchGroup,
    // this solution lets the current run loop to process other events in the meantime.
    while result == nil {
      RunLoop.current.run(mode: .common, before: Date().addingTimeInterval(0.001))
    }
    return try result.get()
  }

  /**
   Synchronously executes an async closure on the JavaScript runtime thread, blocking the current thread until completion.
   Not available in async contexts to prevent blocking the cooperative thread pool.
   */
  @available(*, noasync)
  public func execute<R: Sendable>(
    taskName: String? = "[JS] runtime.execute (\(#function))",
    @_implicitSelfCapture _ closure: @escaping @JavaScriptActor () async throws -> R
  ) throws -> sending R {
    let result = NonisolatedUnsafeVar<Result<R, any Error>>()

    scheduler.scheduleTask(.ImmediatePriority) {
      Task.immediate_polyfill(name: taskName, priority: .high) {
        do {
          result.value = .success(try await closure())
        } catch {
          result.value = .failure(error)
        }
      }
    }

    // Use RunLoop to wait for the task to finish. As opposed to DispatchSemaphore or DispatchGroup,
    // this solution lets the current run loop to process other events in the meantime.
    while result.value == nil {
      RunLoop.current.run(mode: .common, before: Date().addingTimeInterval(0.001))
    }
    return try result.value.get()
  }

  /**
   Asynchronously executes a sync closure on the JavaScript runtime thread, awaiting its completion without blocking.
   */
  public func execute<R: Sendable>(
    @_implicitSelfCapture _ closure: @escaping @JavaScriptActor () throws -> R
  ) async throws -> sending R {
    return try await withUnsafeThrowingContinuation { continuation in
      scheduler.scheduleTask(.ImmediatePriority) {
        do {
          continuation.resume(returning: try JavaScriptActor.assumeIsolated(closure))
        } catch {
          continuation.resume(throwing: error)
        }
      }
    }
  }

  /**
   Asynchronously executes an async closure on the JavaScript runtime thread, awaiting its completion without blocking.
   */
  public func execute<R: Sendable>(
    taskName: String? = "[JS] runtime.execute (async \(#function))",
    @_implicitSelfCapture _ closure: @escaping @JavaScriptActor () async throws -> R
  ) async throws -> sending R {
    return try await withUnsafeThrowingContinuation { continuation in
      scheduler.scheduleTask(.ImmediatePriority) {
        Task.immediate_polyfill(name: taskName, priority: .high) { @JavaScriptActor in
          do {
            continuation.resume(returning: try await closure())
          } catch {
            continuation.resume(throwing: error)
          }
        }
      }
    }
  }

  /**
   Checks whether the function is called on the JavaScript thread.
   */
  public func isOnJavaScriptThread() -> Bool {
    return Thread.current.name == "com.facebook.react.runtime.JavaScript"
  }

  /**
   Asserts whether we are on the JavaScript thread. Helpful for debugging threading issues.
   */
  public func assertThread(file: String = #file, function: String = #function, line: Int = #line) {
    assert(isOnJavaScriptThread(), "Function '\(function)' is not run on the JavaScript thread (\(file):\(line))")
  }

  /**
   Priority of the scheduled task.
   - Note: Keep it in sync with the equivalent C++ enum from React Native (see `SchedulerPriority.h` from `React-callinvoker`).
   */
  public enum SchedulerPriority: Int32 {
    case immediate = 1
    case userBlocking = 2
    case normal = 3
    case low = 4
    case idle = 5
  }

  // MARK: - Script evaluation

  /**
   Evaluates given JavaScript source code.
   */
  @discardableResult
  @JavaScriptActor
  public func eval(label: String? = nil, _ source: String) throws -> JavaScriptValue {
    let stringBuffer = expo.makeSharedStringBuffer(std.string(source))

    do {
      let jsiValue = try capturingCppErrors {
        return expo.evaluateJavaScript(pointee, stringBuffer, std.string(label ?? "<<evaluated>>"))
      }
      return JavaScriptValue(self, jsiValue)
    } catch let error as expo.CppError {
      throw ScriptEvaluationError(message: error.message)
    }
  }

  /**
   Evaluates the given JavaScript source code made by joining an array of strings with a newline separator.
   */
  @available(*, deprecated, message: "Spread the array into arguments instead")
  @discardableResult
  @JavaScriptActor
  public func eval(label: String? = nil, _ lines: [String]) throws -> JavaScriptValue {
    try eval(label: label, lines.joined(separator: "\n"))
  }

  /**
   Evaluates the given JavaScript source code made by joining arguments with a newline separator.
   */
  @discardableResult
  @JavaScriptActor
  public func eval(label: String? = nil, _ lines: String...) throws -> JavaScriptValue {
    try eval(label: label, lines.joined(separator: "\n"))
  }

  /**
   Evaluates given JavaScript source code in an async context. If the evaluated source returns a Promise, it awaits until the promise is resolved/rejected.
   */
  @discardableResult
  @JavaScriptActor
  public func evalAsync(label: String? = nil, _ source: String) async throws -> JavaScriptValue {
    let result = try eval(label: label, source)
    return result.is("Promise") ? try await result.getPromise().await() : result
  }

  // MARK: - Equatable

  public static func == (lhs: JavaScriptRuntime, rhs: JavaScriptRuntime) -> Bool {
    return lhs === rhs
  }

  // MARK: - Caching JavaScriptPropNameID

  @JavaScriptActor
  internal var propNameIdsRegistry: [String: JavaScriptPropNameID] = [:]
}

private func createFunctionClosure(runtime: JavaScriptRuntime, name: String? = nil, _ closure: @escaping JavaScriptRuntime.SyncFunctionClosure) -> expo.HostFunctionClosure {
  let context = Unmanaged.passRetained(HostFunctionContext(runtime: runtime, name: name, closure)).toOpaque()

  func call(context: UnsafeMutableRawPointer, thisPtr: UnsafePointer<facebook.jsi.Value>, argumentsPtr: UnsafePointer<facebook.jsi.Value>, argumentsCount: Int) -> facebook.jsi.Value {
    let context = Unmanaged<HostFunctionContext>.fromOpaque(context).takeUnretainedValue()

    guard let runtime = context.runtime else {
      FatalError.runtimeLost()
    }
    let this = UnsafeMutablePointer(mutating: thisPtr).move()
    let argumentsRef = JavaScriptValuesBuffer(runtime, start: argumentsPtr, count: argumentsCount).ref()

    return JavaScriptActor.assumeIsolated {
      return forwardingSwiftErrorsToJS(runtime: runtime) {
        let thisValue = JavaScriptValue(runtime, this)
        return try context.call(thisValue, argumentsRef.take()).asJSIValue()
      }
    }
  }

  func deallocate(context: UnsafeMutableRawPointer) {
    Unmanaged<HostFunctionContext>.fromOpaque(context).release()
  }

  return expo.HostFunctionClosure(context, call, deallocate)
}

// MARK: - Errors

extension JavaScriptRuntime {
  /**
   Thrown when an invalid JavaScript identifier is passed to APIs that interpolate
   the name into evaluated JavaScript source, such as ``createClass(name:inheriting:_:)``.
   */
  public struct InvalidIdentifierError: Error, CustomStringConvertible {
    /**
     The identifier string that failed validation.
     */
    public let identifier: String

    public var description: String {
      return "'\(identifier)' is not a valid JavaScript identifier"
    }
  }
}
