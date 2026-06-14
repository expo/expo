// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/// A protocol for types that can be converted to a JavaScript value without type erasure.
///
/// `encode` is static and takes the value explicitly so the macro emits one uniform call shape
/// — `T.encode(result, …)` — regardless of the type, and so types that represent absence
/// (e.g. `Optional`) can produce a JavaScript value without first having a non-nil `self`.
/// It is the native → JS half of `JavaScriptCodable`.
///
/// The conversion runs on the JavaScript thread; conformers are called under `@JavaScriptActor`.
/// See `JavaScriptDecodable` for why `appContext` and `runtime` are both `borrowing`.
public protocol JavaScriptEncodable {
  @JavaScriptActor
  static func encode(_ value: Self, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue
}
