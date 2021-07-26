
public struct Promise: AnyMethodArgument {
  public typealias ResolveClosure = (Any?) -> Void
  public typealias RejectClosure = (CodedError) -> Void

  public var resolver: ResolveClosure
  public var rejecter: RejectClosure

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
