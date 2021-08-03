
public struct Promise: AnyMethodArgument {
  public typealias ResolveClosure = (Any?) -> Void
  public typealias RejectClosure = (CodedError) -> Void

  public var resolver: ResolveClosure
  public var rejecter: RejectClosure

  /**
   The rejecter that is compatible with the legacy `EXPromiseRejectBlock`.
   Necessary in some places not converted to Swift, such as `EXPermissionsMethodsDelegate`.
   */
  public var legacyRejecter: EXPromiseRejectBlock {
    return { code, description, error in
      reject(code ?? "", description ?? "")
    }
  }

  public func resolve(_ value: Any? = nil) -> Void {
    resolver(value)
  }

  public func reject(_ error: CodedError) {
    rejecter(error)
  }

  public func reject(_ code: String, _ description: String) -> Void {
    rejecter(SimpleCodedError(code, description))
  }
}
