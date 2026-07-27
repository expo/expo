// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

// `Date` encodes to a JS `Date` and decodes from a JS `Date`, a number of milliseconds since the epoch,
// or a string. Strings are parsed by the runtime's own `new Date(str)` (so parsing is identical on every
// platform, with no native date parser to maintain), which inherits JS's quirks: a zone-less string is
// read as local time, and an unparseable one becomes an `Invalid Date` (`NaN`), decoded as a thrown error.
// A `Date` is an absolute instant with no timezone/calendar; resolution is milliseconds.

extension Date: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Date
  {
    // The cheap tag checks come before `is("Date")`, which does a global lookup plus an `instanceof`
    // walk; a number or string can't be a `Date`, so the order is behavior-neutral.
    if value.isNumber() {
      return try dateFromMilliseconds(value.getDouble())
    }
    if value.isString() {
      let dateConstructor = try runtime.global().getPropertyAsFunction("Date")
      let constructed = try dateConstructor.callAsConstructor(value.copy()).asObject()
      return try dateFromMilliseconds(constructed.callFunction("getTime").asDouble())
    }
    if value.is("Date") {
      return try dateFromMilliseconds(value.asObject().callFunction("getTime").asDouble())
    }
    throw InvalidDateException()
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Date, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    let milliseconds = value.timeIntervalSince1970 * 1000.0
    let dateConstructor = try runtime.global().getPropertyAsFunction("Date")
    // Typed explicitly so the variadic `callAsConstructor` overload is chosen over the `JavaScriptValuesBuffer?` one.
    let millisecondsValue: JavaScriptValue = .number(milliseconds)
    return try dateConstructor.callAsConstructor(millisecondsValue)
  }
}

/// The largest magnitude, in milliseconds, a JS `Date` can represent (100,000,000 days from the epoch,
/// ECMAScript TimeClip); a value beyond it is an `Invalid Date`.
@usableFromInline
let maxJavaScriptDateMilliseconds: Double = 8_640_000_000_000_000

/// Builds a `Date` from a milliseconds value, applying the JS `Date` constructor's TimeClip: a non-finite
/// or out-of-range value throws, an in-range one is truncated toward zero. This keeps the number branch
/// faithful to `new Date(number)`; the `Date`/string branches pass an already-clipped `getTime()` through.
@usableFromInline
func dateFromMilliseconds(_ milliseconds: Double) throws -> Date {
  guard milliseconds.isFinite, abs(milliseconds) <= maxJavaScriptDateMilliseconds else {
    throw InvalidDateException()
  }
  return Date(timeIntervalSince1970: milliseconds.rounded(.towardZero) / 1000.0)
}

/// Thrown when a JavaScript value can't be converted to a `Date`. Named after JS's own "Invalid Date".
public struct InvalidDateException: JavaScriptThrowable {
  @usableFromInline
  init() {}

  public var code: String {
    "ERR_INVALID_DATE"
  }
  public var message: String {
    "Cannot convert the JavaScript value to a Date because it is not a Date, a number of milliseconds since the epoch, or a parseable date string"
  }
}
