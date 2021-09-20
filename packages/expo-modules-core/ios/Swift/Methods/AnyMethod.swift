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
   Bool value indicating whether the method takes promise as the last argument.
   */
  var takesPromise: Bool { get }

  /**
   A number of arguments the method takes. If the last argument is of type `Promise`, it is not counted.
   */
  var argumentsCount: Int { get }

  /**
   Dispatch queue on which each method's call is run.
   */
  var queue: DispatchQueue? { get }

  /**
   Calls the method on given module with arguments and a promise.
   */
  func call(module: AnyModule, args: [Any?], promise: Promise) -> Void

  /**
   Synchronously calls the method with given arguments. If the method takes a promise,
   the current thread will be locked until the promise rejects or resolves with the return value.
   */
  func callSync(args: [Any?]) -> Any?

  /**
   Specifies on which queue the method should run.
   */
  func runOnQueue(_ queue: DispatchQueue?) -> Self
}
