// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

// `Either` is `JavaScriptCodable`. Its value is stored as `Any?`, so instead of recursing statically
// into the generic parameters, the conversion walks the `AnyDynamicType` converters that
// `dynamicTypes()` returns and takes the first one that accepts the value. Those converters need the
// app context, recovered from the runtime like `Record` does.
//
// The conformance is declared on `Either` alone. `EitherOfThree` and `EitherOfFour` inherit it and
// override `dynamicTypes()`, so an inherited conversion still sees their extra types.

extension Either: JavaScriptDecodable, JavaScriptEncodable {
  @JavaScriptActor
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Self {
    guard let appContext = AppContext.from(runtime: runtime) else {
      throw Exceptions.AppContextNotFound()
    }
    let types = Self.dynamicTypes()

    for type in types {
      if let converted = try? type.cast(jsValue: value, appContext: appContext) {
        return Self(converted)
      }
    }
    throw NeitherTypeException(types)
  }

  // The parameter is `Either<FirstType, SecondType>` rather than `Self` because a non-final class
  // can't take a covariant `Self`. A subclass instance passes as its superclass.
  @JavaScriptActor
  public static func encode(
    _ value: Either<FirstType, SecondType>,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> JavaScriptValue {
    guard let appContext = AppContext.from(runtime: runtime) else {
      throw Exceptions.AppContextNotFound()
    }
    // `Either` adds no representation in JavaScript, so the wrapped value converts on its own.
    return try Conversions.anyToJavaScriptValue(value.value, appContext: appContext, in: runtime)
  }
}
