// Copyright 2022-present 650 Industries. All rights reserved.

/**
 Type-erased protocol for synchronous functions.
 */
internal protocol AnySyncFunctionDefinition: AnyFunctionDefinition {
  /**
   Calls the function synchronously with given arguments.
   - Parameters:
     - owner: An object that calls this function. If the `takesOwner` property is true
       and type of the first argument matches the owner type, it's being passed as the argument.
     - args: An array of arguments to pass to the function. The arguments must be of the same type as in the underlying closure.
     - appContext: An app context where the function is executed.
   - Returns: A value returned by the called function when succeeded or an error when it failed.
   */
  func call(by owner: AnyObject?, withArguments args: [Any], appContext: AppContext) throws -> Any

  /**
   Calls the function synchronously with given `this` and arguments as JavaScript values.
   It **must** be run on the thread used by the JavaScript runtime.
   */
  @discardableResult
  func call(_ appContext: AppContext, withThis this: JavaScriptValue?, arguments: [JavaScriptValue]) throws -> JavaScriptValue
}

/**
 Represents a function that can only be called synchronously.
 */
public class SyncFunctionDefinition<Args, FirstArgType, ReturnType>: AnySyncFunctionDefinition, @unchecked Sendable {
  typealias ClosureType = (Args) throws -> ReturnType

  /**
   The underlying closure to run when the function is called.
   */
  let body: ClosureType

  init(
    _ name: String,
    firstArgType: FirstArgType.Type,
    dynamicArgumentTypes: [AnyDynamicType],
    returnType: AnyDynamicType = ~ReturnType.self,
    _ body: @escaping ClosureType
  ) {
    self.name = name
    self.dynamicArgumentTypes = dynamicArgumentTypes
    self.returnType = returnType
    self.body = body
  }

  // MARK: - AnyFunction

  let name: String

  let dynamicArgumentTypes: [AnyDynamicType]

  let returnType: AnyDynamicType

  var argumentsCount: Int {
    return dynamicArgumentTypes.count - (takesOwner ? 1 : 0)
  }

  var takesOwner: Bool = false

  func call(by owner: AnyObject?, withArguments args: [Any], appContext: AppContext, callback: @escaping (FunctionCallResult) -> ()) {
    do {
      let result = try call(by: owner, withArguments: args, appContext: appContext)
      callback(.success(Conversions.convertFunctionResult(result, appContext: appContext, dynamicType: ~ReturnType.self)))
    } catch let error as Exception {
      callback(.failure(error))
    } catch {
      callback(.failure(UnexpectedException(error)))
    }
  }

  // MARK: - AnySyncFunctionDefinition

  func call(by owner: AnyObject?, withArguments args: [Any], appContext: AppContext) throws -> Any {
    do {
      try validateArgumentsNumber(function: self, received: args.count)

      var arguments = concat(
        arguments: args,
        withOwner: owner,
        withPromise: nil,
        forFunction: self,
        appContext: appContext
      )

      // Convert JS values to non-JS native types.
      arguments = try cast(jsValues: arguments, forFunction: self, appContext: appContext)

      // Convert arguments to the types desired by the function.
      arguments = try cast(arguments: arguments, forFunction: self, appContext: appContext)

      guard let argumentsTuple = try Conversions.toTuple(arguments) as? Args else {
        throw ArgumentConversionException()
      }

      return try body(argumentsTuple)
    } catch let error as Exception {
      throw FunctionCallException(name).causedBy(error)
    } catch {
      throw UnexpectedException(error)
    }
  }

  func call(_ appContext: AppContext, withThis this: JavaScriptValue?, arguments: [JavaScriptValue]) throws -> JavaScriptValue {
    do {
      try validateArgumentsNumber(function: self, received: arguments.count)

      // This array will include the owner (if needed) and function arguments.
      var allNativeArguments: [Any] = []

      // If the function takes the owner, convert it and add to the final arguments.
      if takesOwner, let this, let ownerType = dynamicArgumentTypes.first {
        let nativeOwner = try appContext.converter.toNative(this, ownerType)
        allNativeArguments.append(nativeOwner)
      }

      // Convert JS values to non-JS native types desired by the function.
      let nativeArguments = try appContext.converter.toNative(arguments, Array(dynamicArgumentTypes.dropFirst(allNativeArguments.count)))

      allNativeArguments.append(contentsOf: nativeArguments)

      // Fill in with nils in place of missing optional arguments.
      if arguments.count < argumentsCount {
        allNativeArguments.append(contentsOf: Array(repeating: Any?.none as Any, count: argumentsCount - arguments.count))
      }

      guard let argumentsTuple = try Conversions.toTuple(allNativeArguments) as? Args else {
        throw ArgumentConversionException()
      }
      let result = try body(argumentsTuple)

      return try appContext.converter.toJS(result, returnType)
    } catch let error as Exception {
      throw FunctionCallException(name).causedBy(error)
    } catch {
      throw UnexpectedException(error)
    }
  }

  func callNumbers(_ appContext: AppContext, withThis this: JavaScriptValue?, arguments: [Double]) throws -> Double {
    do {
      guard let argumentsTuple = try Conversions.toTuple(arguments) as? Args else {
        throw ArgumentConversionException()
      }
      let result = try body(argumentsTuple)

      return result as! Double
    } catch let error as Exception {
      throw FunctionCallException(name).causedBy(error)
    } catch {
      throw UnexpectedException(error)
    }
  }

  // MARK: - JavaScriptObjectBuilder

  @JavaScriptActor
  func build(appContext: AppContext) throws -> JavaScriptObject {
    // We intentionally capture a strong reference to `self`, otherwise the "detached" objects would
    // immediately lose the reference to the definition and thus the underlying native function.
    // It may potentially cause memory leaks, but at the time of writing this comment,
    // the native definition instance deallocates correctly when the JS VM triggers the garbage collector.

    // Try to use the optimized path if this function signature is supported
//    if let typeEncoding = generateTypeEncoding(), canUseOptimizedPath(typeEncoding), name == "addNumbers" {
//      return try buildOptimized(appContext: appContext, typeEncoding: typeEncoding)
//    }

    // Fall back to standard path
    return try appContext.runtime.createSyncFunction(name, argsCount: argumentsCount) { [weak appContext, self] this, arguments in
      guard let appContext else {
        throw Exceptions.AppContextLost()
      }
      return try self.call(appContext, withThis: this, arguments: arguments)
    }
  }

  // MARK: - Optimized Path

  /// Generates Objective-C type encoding string for this function signature
  /// Returns nil if the signature cannot be represented in the optimized format
  private func generateTypeEncoding() -> String? {
    // Only support functions with 0-2 arguments for now
    guard argumentsCount >= 0 && argumentsCount <= 2 else {
      return nil
    }

    // Don't support functions that take owner (this) parameter
    guard !takesOwner else {
      return nil
    }

    var encoding = ""

    // Encode return type
    guard let returnEncoding = typeToEncoding(ReturnType.self) else {
      return nil
    }
    encoding += returnEncoding

    // Add block marker
    encoding += "@?"

    // Encode arguments
    for dynamicType in dynamicArgumentTypes {
      guard let argEncoding = dynamicTypeToEncoding(dynamicType) else {
        return nil
      }
      encoding += argEncoding
    }

    return encoding
  }

  /// Converts a Swift type to Objective-C type encoding character
  private func typeToEncoding(_ type: Any.Type) -> String? {
    switch type {
    case is Double.Type:
      return "d"
    case is Int.Type, is Int64.Type:
      return "q"
    case is String.Type:
      return "@"
    case is Bool.Type:
      return "B"
    default:
      return nil
    }
  }

  /// Converts a dynamic type to Objective-C type encoding character
  private func dynamicTypeToEncoding(_ dynamicType: AnyDynamicType) -> String? {
    // Use the inner type's description to determine encoding
    let typeDescription = String(describing: dynamicType)

    if typeDescription.contains("Double") {
      return "d"
    } else if typeDescription.contains("Int") {
      return "q"
    } else if typeDescription.contains("String") {
      return "@"
    } else if typeDescription.contains("Bool") {
      return "B"
    }

    return nil
  }

  /// Checks if the given type encoding is supported by the optimized runtime
  private func canUseOptimizedPath(_ typeEncoding: String) -> Bool {
    let supportedSignatures: Set<String> = [
      // Double variants
      "d@?", "d@?d", "d@?dd",
      // Int variants
      "q@?", "q@?q", "q@?qq",
      // String variants
      "@@?", "@@?@", "@@?@@",
      // Bool variants
      "B@?", "B@?B", "B@?BB"
    ]
    return supportedSignatures.contains(typeEncoding)
  }

  /// Builds the function using the optimized createSyncFunction:typeEncoding: path
  @JavaScriptActor
  private func buildOptimized(appContext: AppContext, typeEncoding: String) throws -> JavaScriptObject {
    // We need to create a non-throwing wrapper block because Swift throwing closures
    // are not compatible with ObjC blocks. We handle errors by catching them and
    // throwing NSExceptions which the ObjC side can catch and convert to JSErrors.

    // For now, we need to create typed wrappers for each signature.
    // The body is (Args) throws -> ReturnType, but we need a non-throwing block.
    let wrappedBody: AnyObject

    switch typeEncoding {
    case "d@?dd":
      // (Double, Double) -> Double
      let typedBody = body as! ((Double, Double)) throws -> Double
      let block: @convention(block) (Double, Double) -> Double = { arg0, arg1 in
        do {
          return try typedBody((arg0, arg1))
        } catch let error as Exception {
          // Throw an NSException so the ObjC side can catch it
          let nsException = NSException(
            name: NSExceptionName("SwiftFunctionException"),
            reason: error.description,
            userInfo: ["code": error.code, "message": error.description]
          )
          nsException.raise()
          return 0.0 // Never reached
        } catch {
          let nsException = NSException(
            name: NSExceptionName("SwiftFunctionException"),
            reason: error.localizedDescription,
            userInfo: ["message": error.localizedDescription]
          )
          nsException.raise()
          return 0.0 // Never reached
        }
      }
      wrappedBody = block as AnyObject

    default:
      throw GenericException("Unsupported type encoding for optimized path: \(typeEncoding)")
    }

    return try appContext.runtime.createSyncFunction(
      name,
      typeEncoding: typeEncoding,
      argsCount: argumentsCount,
      body: wrappedBody
    )
  }
}
