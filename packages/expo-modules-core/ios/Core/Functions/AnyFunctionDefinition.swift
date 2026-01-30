import ExpoModulesJSI

/**
 An alias to `Result<JavaScriptRef<JavaScriptValue>, Exception>` which can be passed to the function callback.
 */
public typealias FunctionCallResult = Result<JavaScriptRef<JavaScriptValue>, Exception>

/**
 A protocol for any type-erased function.
 */
internal protocol AnyFunctionDefinition: AnyDefinition, JavaScriptObjectBuilder, ~Copyable {
  /**
   Name of the function. JavaScript refers to the function by this name.
   */
  var name: String { get }

  /**
   An array of the dynamic types that the function takes. If the last type is `Promise`, it's not included.
   */
  var dynamicArgumentTypes: [AnyDynamicType] { get }

  /**
   A number of arguments the function takes. If the function expects to receive an owner (`this`) as the first argument, it's not counted.
   Similarly, if the last argument is of type `Promise`, it is not counted.
   */
  var argumentsCount: Int { get }

  /**
   A minimum number of arguments the functions needs which equals to `argumentsCount` reduced by the number of trailing optional arguments.
   */
  var requiredArgumentsCount: Int { get }

  /**
   Indicates whether the function's arguments starts from the owner that calls this function.
   */
  var takesOwner: Bool { get set }

//  /**
//   Calls the function with a given owner and arguments and returns a result through the callback block.
//   - Parameters:
//      - appContext: An app context where the function is being executed.
//      - this: `JavaScriptValue` of the function caller.
//      - arguments: A buffer of `JavaScriptValue` arguments to pass to the function.
//      - callback: A callback that receives a result of the function execution.
//   */
//  func call(
//    _ appContext: AppContext,
//    this: borrowing JavaScriptValue,
//    arguments: consuming JSValuesBuffer,
//    callback: @Sendable @escaping (consuming FunctionCallResult) -> Void
//  )
}

extension AnyFunctionDefinition {
  var requiredArgumentsCount: Int {
    var trailingOptionalArgumentsCount: Int = 0

    for dynamicArgumentType in dynamicArgumentTypes.reversed() {
      if dynamicArgumentType is DynamicOptionalType {
        trailingOptionalArgumentsCount += 1
      } else {
        break
      }
    }
    return argumentsCount - trailingOptionalArgumentsCount
  }

  var argumentsCount: Int {
    return dynamicArgumentTypes.count
  }
}

internal final class FunctionCallException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Calling the '\(param)' function has failed"
  }

  override var code: String {
    guard let cause = cause as? Exception else {
      return super.code
    }
    return cause.code
  }
}

internal final class ArgumentConversionException: Exception, @unchecked Sendable {
  override var reason: String {
    "Failed to downcast arguments"
  }
}
