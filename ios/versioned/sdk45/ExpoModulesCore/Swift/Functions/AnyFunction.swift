import Dispatch

/**
 A protocol for any type-erased function.
 */
public protocol AnyFunction: AnyDefinition {
  /**
   Name of the function. JavaScript refers to the function by this name.
   */
  var name: String { get }

  /**
   Bool value indicating whether the function takes promise as the last argument.
   */
  var takesPromise: Bool { get }

  /**
   A number of arguments the function takes. If the last argument is of type `Promise`, it is not counted.
   */
  var argumentsCount: Int { get }

  /**
   Dispatch queue on which each function's call is run.
   */
  var queue: DispatchQueue? { get }

  /**
   Whether the function needs to be called asynchronously from JavaScript.
   */
  var isAsync: Bool { get }

  /**
   Calls the function on given module with arguments and a promise.
   */
  func call(args: [Any], promise: Promise)

  /**
   Synchronously calls the function with given arguments. If the function takes a promise,
   the current thread will be locked until the promise rejects or resolves with the return value.
   */
  func callSync(args: [Any]) -> Any

  /**
   Specifies on which queue the function should run.
   */
  func runOnQueue(_ queue: DispatchQueue?) -> Self

  /**
   Makes the JavaScript function synchronous.
   */
  func runSynchronously() -> Self
}
