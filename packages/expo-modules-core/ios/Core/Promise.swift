// Copyright 2021-present 650 Industries. All rights reserved.

import ExpoModulesJSI

public struct Promise: AnyArgument, Sendable {
  public typealias ResolveClosure = @Sendable (_ value: JavaScriptValue) -> Void
  public typealias RejectClosure = @Sendable (Exception) -> Void

  internal weak var appContext: AppContext?
  public var resolver: ResolveClosure
  public var rejecter: RejectClosure

  /**
   The resolver that is compatible with the legacy `EXPromiseResolveBlock`.
   Necessary in some places not converted to Swift, such as `EXPermissionsMethodsDelegate`.
   */
  public var legacyResolver: EXPromiseResolveBlock {
    return { value in
      resolve(value)
    }
  }

  /**
   The rejecter that is compatible with the legacy `EXPromiseRejectBlock`.
   Necessary in some places not converted to Swift, such as `EXPermissionsMethodsDelegate`.
   */
  public var legacyRejecter: EXPromiseRejectBlock {
    return { code, description, _ in
      reject(code ?? "", description ?? "")
    }
  }

  public func resolve(_ value: Any? = nil) {
    // Using the dynamic type for Any is the slowest path, but we need this for backwards compatibility.
    // Translate Swift nil to NSNull so `anyToJavaScriptValue` resolves it to JS `null` rather than `undefined`.
    tryResolve(NonisolatedUnsafeVar(value ?? NSNull()).value, dynamicType: ~Any.self)
  }

  public func resolve<T: AnyArgument>(_ value: sending T) {
    tryResolve(value, dynamicType: T.getDynamicType())
  }

  /**
   Resolves the promise with the given value, using the provided dynamic type for JS conversion.
   Used by `AsyncFunctionDefinition` to auto-resolve with the function's declared return type,
   enabling type-aware conversion when the value's static type isn't available at the call site.
   */
  public func resolve(_ value: Any, dynamicType: AnyDynamicType) {
    tryResolve(NonisolatedUnsafeVar(value).value, dynamicType: dynamicType)
  }

  public func reject(_ error: Error) {
    if let exception = error as? Exception {
      rejecter(exception)
    } else {
      rejecter(UnexpectedException(error))
    }
  }

  public func reject(_ error: Exception) {
    rejecter(error)
  }

  public func reject(_ code: String, _ description: String) {
    rejecter(Exception(name: code, description: description, code: code))
  }

  public func settle<ValueType, ExceptionType: Exception>(with result: Result<ValueType, ExceptionType>) {
    switch result {
    case .success(let value):
      resolve(value)
    case .failure(let exception):
      reject(exception)
    }
  }

  // MARK: - Private

  private func tryResolve<T>(_ value: sending T, dynamicType: AnyDynamicType) {
    guard let appContext, let runtime = try? appContext.runtime else {
      return
    }
    runtime.schedule(priority: .immediate) {
      do {
        let value = try appContext.converter.toJS(value, dynamicType)
        resolver(value)
      } catch {
        reject(error)
      }
    }
  }
}
