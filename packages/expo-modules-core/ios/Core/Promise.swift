// Copyright 2021-present 650 Industries. All rights reserved.

public struct Promise: AnyArgument {
  public typealias ResolveClosure = (Any?) -> Void
  public typealias RejectClosure = (Exception) -> Void

  internal weak var appContext: AppContext?
  public var resolver: ResolveClosure
  public var rejecter: RejectClosure

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
    if let value = value as? AnySharedObject {
      resolver(JavaScriptSharedObjectBinding.init {
        return Conversions.convertFunctionResult(
          value,
          appContext: appContext,
          dynamicType: type(of: value).getDynamicType()
          // swiftlint:disable:next force_cast
        ) as! JavaScriptObject
      })
      return
    }
    resolver(value)
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
}
