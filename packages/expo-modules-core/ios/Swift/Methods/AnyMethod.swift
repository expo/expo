import Dispatch

/**
 A protocol for any type-erased module's method.
 */
public protocol AnyMethod: AnyDefinition {
  /**
   Name of the exported method. JavaScript refers to the method by this name.
   */
  var name: String { get }

  /**
   A number of arguments the method takes. If the last argument is of type `Promise`, it is not counted.
   */
  var argumentsCount: Int { get }

  /**
   Dispatch queue on which each method's call is run.
   */
  var queue: DispatchQueue? { get }

  /**
   Calls the method with given arguments and a promise.
   */
  func call(args: [Any?], promise: Promise) -> Void

  /**
   Specifies on which queue the method should run.
   */
  func runOnQueue(_ queue: DispatchQueue?) -> Self
}
