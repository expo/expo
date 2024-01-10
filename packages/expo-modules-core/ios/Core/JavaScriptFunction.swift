// Copyright 2023-present 650 Industries. All rights reserved.

/**
 Represents a JavaScript function that can be called by the native code and that must return the given generic `ReturnType`.
 */
public final class JavaScriptFunction<ReturnType>: AnyArgument, AnyJavaScriptValue {
  /**
   Raw representation of the JavaScript function that doesn't impose any restrictions on the returned type.
   */
  private let rawFunction: RawJavaScriptFunction

  /**
   Weak reference to the app context that is necessary to convert some arguments associated with the context (e.g. shared objects).
   */
  private weak var appContext: AppContext?

  init(rawFunction: RawJavaScriptFunction, appContext: AppContext) {
    self.rawFunction = rawFunction
    self.appContext = appContext
  }

  // MARK: - Calling

  /**
   Calls the function with the given `this` object and arguments.
   */
  public func call(_ arguments: Any..., usingThis this: JavaScriptObject? = nil) throws -> ReturnType {
    return try call(withArguments: arguments, asConstructor: false, usingThis: this)
  }

  /**
   Calls the function as a constructor with the given arguments. It's like calling a function with the `new` keyword.
   */
  public func callAsConstructor(_ arguments: Any...) throws -> ReturnType {
    return try call(withArguments: arguments, asConstructor: true, usingThis: nil)
  }

  /**
   Universal function that calls the function with given arguments, this object and whether to call it as a constructor.
   */
  private func call(withArguments arguments: [Any] = [], asConstructor: Bool = false, usingThis this: JavaScriptObject? = nil) throws -> ReturnType {
    guard let appContext else {
      throw AppContextLostException()
    }
    let value = rawFunction.call(withArguments: arguments, thisObject: this, asConstructor: false)
    let dynamicType = ~ReturnType.self

    guard let result = try dynamicType.cast(jsValue: value, appContext: appContext) as? ReturnType else {
      throw UnexpectedReturnType(dynamicType.description)
    }
    return result
  }

  // MARK: - AnyJavaScriptValue

  internal static func convert(from value: JavaScriptValue, appContext: AppContext) throws -> Self {
    guard value.kind == .function else {
      throw Conversions.ConvertingException<JavaScriptFunction<ReturnType>>(value)
    }
    return Self(rawFunction: value.getFunction(), appContext: appContext)
  }
}

private final class UnexpectedReturnType: GenericException<String> {
  override var reason: String {
    return "The function returned a value that cannot be converted to \(param)"
  }
}
