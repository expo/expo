
public struct Promise: AnyMethodArgument {
  public typealias ResolveClosure = (Any?) -> Void
  public typealias RejectClosure = (String, String, Error?) -> Void

  public var resolve: ResolveClosure
  public var reject: RejectClosure

  public func reject(_ description: String, _ error: Error? = nil) -> Void {
    reject("ERR", description, error)
  }

  public func reject(_ error: Error) -> Void {
    reject("ERR", error.localizedDescription, error)
  }
}
