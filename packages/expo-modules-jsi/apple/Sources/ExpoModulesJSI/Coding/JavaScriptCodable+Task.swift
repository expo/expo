// Copyright 2025-present 650 Industries. All rights reserved.

// `JavaScriptEncodable` conformance for `Task`, encoding it to a JavaScript `Promise`. This lets
// native code hand JavaScript a promise as a value: the return of a synchronous `@JS func` whose
// result type is `Task`, or a `Task` nested inside another encoded value. `createAsyncFunction`
// only wraps a function's own return in a promise, so a `Task` is how to produce one anywhere else.
//
// Encode-only: a promise decodes by awaiting it through `JavaScriptPromise`, not by reconstructing
// a `Task`. One conditional conformance covers throwing and non-throwing tasks (Swift forbids two
// conformances even with disjoint bounds, and `Task.value` is `async throws` for any `Failure`).

/// Encodes a `Task` to a JavaScript promise that settles with the task's result.
extension Task: JavaScriptEncodable where Success: JavaScriptEncodable, Failure: Error {
  /// Returns a pending promise immediately and settles it on the JavaScript thread once the task
  /// completes: fulfilling with the encoded `Success` value, or rejecting with the thrown error.
  @JavaScriptActor
  public static func encode(_ value: Task<Success, Failure>, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptValue
  {
    let promise = try JavaScriptPromise(copy runtime)
    // A detached task awaits the result off the JavaScript thread, then settles the promise. It must
    // not inherit `@JavaScriptActor`: that actor runs jobs synchronously on the current thread rather
    // than hopping to the JS thread, so a resumed continuation would land on whatever thread the task
    // finished on. `resolve`/`reject` hop to the JS thread internally (and the encodable `resolve`
    // encodes there), so settling from here is safe regardless of this task's thread.
    Task<Void, Never>.detached {
      do {
        promise.resolve(try await value.value)
      } catch {
        promise.reject(error)
      }
    }
    return promise.asValue()
  }
}
