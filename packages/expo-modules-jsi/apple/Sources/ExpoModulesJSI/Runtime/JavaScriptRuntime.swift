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
   The underlying JSI runtime this `JavaScriptRuntime` points to.
   Note that `facebook.jsi.Runtime` is annotated with `SWIFT_UNSAFE_REFERENCE` in our copy of `jsi.h` header,
   so for the Swift compiler it is treated as a reference type (like `class` and not `struct`).
   This is important because the `facebook.jsi.Runtime`:
   - is an abstract class with many virtual methods. Swift/C++ interop does not support calling pure virtual methods on value types.
   - is non-copyable. As a value type, we would have to "borrow" it from React Native in an unsafe manner.
   */
  internal/*!*/ let pointee: facebook.jsi.Runtime
  internal/*!*/ let scheduler: expo.RuntimeScheduler

  /**
   Actor for running runtime work.
   */
  lazy var runtimeActor: JavaScriptRuntimeActor = JavaScriptRuntimeActor(runtime: self)

  public init(provider: JavaScriptRuntimeProvider) {
    self.pointee = provider.consume()
    self.scheduler = expo.RuntimeScheduler(pointee)
  }

  /**
   Creates a runtime from the JSI runtime.
   */
  internal/*!*/ init(_ runtime: facebook.jsi.Runtime) {
    self.pointee = runtime
    self.scheduler = expo.RuntimeScheduler(runtime)
  }

  /**
   Creates Hermes runtime.
   */
  public init() {
    self.pointee = expo.createHermesRuntime()
    self.scheduler = expo.RuntimeScheduler(pointee)
  }

  /**
   Raw pointer to the underlying JSI runtime. DO NOT USE IT!
   */
  @_spi(Unsafe)
  public var unsafe_pointee: UnsafeMutableRawPointer {
    return Unmanaged<facebook.jsi.Runtime>.passUnretained(pointee).toOpaque()
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
   */
  public func createHostObject(
    get: @escaping (_ propertyName: String) -> JavaScriptValue,
    set: @escaping (_ propertyName: String, _ value: JavaScriptValue) -> Void,
    getPropertyNames: @escaping () -> [String],
    dealloc: @escaping () -> Void
  ) -> JavaScriptObject {
    func getter(context: UnsafeMutableRawPointer, propertyName: UnsafePointer<CChar>) -> facebook.jsi.Value {
      let context = Unmanaged<HostObjectContext>.fromOpaque(context).takeUnretainedValue()
      return context.get(String(cString: propertyName)).asJSIValue()
    }

    func setter(context: UnsafeMutableRawPointer, propertyName: UnsafePointer<CChar>, valuePointer: UnsafeMutableRawPointer) {
      let context = Unmanaged<HostObjectContext>.fromOpaque(context).takeUnretainedValue()
      let value = JavaScriptValue(context.runtime, valuePointer.assumingMemoryBound(to: facebook.jsi.Value.self).move())
      context.set(String(cString: propertyName), value)
    }

    func propertyNamesGetter(context: UnsafeMutableRawPointer) -> expo.HostObjectCallbacks.PropNameIds {
      let context = Unmanaged<HostObjectContext>.fromOpaque(context).takeUnretainedValue()
      let propertyNames = context.getPropertyNames()
      var vector = expo.HostObjectCallbacks.PropNameIds()

      vector.reserve(propertyNames.count)

      for propertyName in propertyNames {
        let propNameId = facebook.jsi.PropNameID.forUtf8(context.runtime.pointee, std.string(propertyName))
        vector.push_back(consuming: propNameId)
      }
      return vector
    }

    func deallocate(context: UnsafeMutableRawPointer) {
      Unmanaged<HostObjectContext>.fromOpaque(context).release()
    }

    let context = Unmanaged.passRetained(HostObjectContext(runtime: self, get, set, getPropertyNames, dealloc)).toOpaque()
    let callbacks = expo.HostObjectCallbacks(context, getter, setter, propertyNamesGetter, deallocate)
    let hostObject = expo.HostObject.makeObject(pointee, callbacks)

    return JavaScriptObject(self, hostObject)
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
   Type of the closure that is passed to the `createSyncFunction` function.
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
    let klassValue = try eval(label: "\(name).\(nativeConstructorKey)", "(function \(name)(...args) { return this.\(nativeConstructorKey)(...args); })")
    let klassObject = klassValue.getObject()

    // Create a host function that is called by the constructor
    let nativeConstructor = createSyncFunction(name) { this, arguments in
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
  public func createSyncFunction(_ name: String, _ function: sending @escaping SyncFunctionClosure) -> JavaScriptFunction {
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
    return createSyncFunction(name) { this, arguments in
      let promise = JavaScriptPromise(self)

      // Need to switch to reference semantics as Task escapes the closure (consumes on capture).
      // Arguments buffer needs to be copied to ensure safe async access.
      let thisRef = this.ref()
      let argumentsRef = arguments.copy().ref()

      // Switch to asynchronous context.
      self.schedule(taskName: "[JS] Async function \(name)") {
        // Invoke the asynchronous function and resolve/reject the promise.
        do {
          let result = try await function(thisRef.take(), argumentsRef.take())
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
   Schedules a closure to be executed with granted synchronized access to the runtime.
   */
  public func schedule(priority: SchedulerPriority = .normal, @_implicitSelfCapture _ closure: @escaping @JavaScriptActor () -> sending Void) -> Void {
    let reactPriority = facebook.react.SchedulerPriority(rawValue: priority.rawValue) ?? .NormalPriority
    scheduler.scheduleTask(reactPriority) {
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
      RunLoop.current.run(mode: .common, before: Date())
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
      RunLoop.current.run(mode: .common, before: Date())
    }
    return try result.value.get()
  }

  /**
   Asynchronously executes a closure on the JavaScript runtime thread, awaiting its completion without blocking.
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
    let this = UnsafeMutablePointer(mutating: thisPtr).move()
    let argumentsRef = JavaScriptValuesBuffer(context.runtime, start: argumentsPtr, count: argumentsCount).ref()

    return JavaScriptActor.assumeIsolated {
      do {
        let thisValue = JavaScriptValue(context.runtime, this)
        let result = try context.call(thisValue, argumentsRef.take())
        return result.asJSIValue()
      } catch {
        // TODO: Implement throwing `facebook.jsi.JSError`, returns `undefined` until then
        return .undefined()
      }
    }
  }

  func deallocate(context: UnsafeMutableRawPointer) {
    Unmanaged<HostFunctionContext>.fromOpaque(context).release()
  }

  return expo.HostFunctionClosure(context, call, deallocate)
}
