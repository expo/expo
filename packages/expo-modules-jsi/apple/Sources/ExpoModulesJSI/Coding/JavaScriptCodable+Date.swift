// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

// `Date` encodes to a JS `Date` and decodes from a JS `Date`, a number of milliseconds since the epoch,
// or a string. Strings are parsed by the runtime's own `Date.parse`, which parses exactly like
// `new Date(str)` (so parsing is identical on every platform, with no native date parser to maintain), and
// inherits JS's quirks: a zone-less string is read as local time, and an unparseable one becomes `NaN`,
// decoded as a thrown error. A `Date` is an absolute instant with no timezone/calendar; resolution is
// milliseconds.

extension Date: JavaScriptCodable {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return [.number, .string, .object]
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Date
  {
    // Forwards to the unowned overload, which holds the implementation.
    return try value.withUnownedValue(in: runtime) { unownedValue in
      return try decode(unownedValue, in: runtime)
    }
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Date
  {
    // The cheap tag checks come before the calls into the runtime; a number or a string can't be a
    // `Date`, so the order is behavior-neutral.
    if value.isNumber() {
      return try dateFromMilliseconds(value.getDouble())
    }
    if value.isString() {
      return try dateFromMilliseconds(parseJavaScriptDate(value, in: runtime))
    }
    if value.isObject(), let milliseconds = try javaScriptDateMilliseconds(of: value, in: runtime) {
      return try dateFromMilliseconds(milliseconds)
    }
    throw InvalidDateException()
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Date, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return try makeJavaScriptDate(milliseconds: value.timeIntervalSince1970 * 1000.0, in: runtime)
  }
}

/// The runtime's `Date` constructor and the `Date` functions that the conversions call. They are looked
/// up once per runtime and cached, so a conversion doesn't pay for the global property lookups.
internal final class DateFunctions {
  let constructor: JavaScriptFunction
  let parse: JavaScriptFunction
  let getTime: JavaScriptFunction

  @JavaScriptActor
  init(in runtime: borrowing JavaScriptRuntime) throws {
    let constructor = try runtime.global().getPropertyAsFunction("Date")
    let constructorObject = constructor.asObject()
    self.parse = try constructorObject.getPropertyAsFunction("parse")
    self.getTime = try constructorObject.getPropertyAsObject("prototype").getPropertyAsFunction("getTime")
    self.constructor = constructor
  }
}

@JavaScriptActor
private func dateFunctions(in runtime: borrowing JavaScriptRuntime) throws -> DateFunctions {
  return try runtime.cached(JavaScriptRuntime.CacheKeys.date) {
    return try DateFunctions(in: runtime)
  }
}

/// Parses a JS string with `Date.parse`. Returns `NaN` for a string that the runtime can't parse.
@usableFromInline
@JavaScriptActor
internal func parseJavaScriptDate(
  _ string: borrowing JavaScriptUnownedValue,
  in runtime: borrowing JavaScriptRuntime
) throws -> Double {
  // `Date.parse` returns the time value without creating the `Date` object that `new Date(str)` does.
  // The call takes an owning argument, so the string is copied; a string is the rare input.
  let argument = string.copied(in: runtime)
  return try dateFunctions(in: runtime).parse.call(argument: argument).asDouble()
}

/// Returns the time value of a JS `Date`, or `nil` when the object is not a `Date`.
@usableFromInline
@JavaScriptActor
internal func javaScriptDateMilliseconds(
  of value: borrowing JavaScriptUnownedValue,
  in runtime: borrowing JavaScriptRuntime
) throws -> Double? {
  let functions = try dateFunctions(in: runtime)
  let object = value.getObject(in: runtime)
  guard object.instanceOf(functions.constructor) else {
    return nil
  }
  // Calling `Date.prototype.getTime` directly skips the property lookup of `object.getTime()`.
  return try functions.getTime.call(this: object).asDouble()
}

/// Creates a JS `Date` for the given number of milliseconds since the epoch.
@usableFromInline
@JavaScriptActor
internal func makeJavaScriptDate(milliseconds: Double, in runtime: borrowing JavaScriptRuntime) throws
  -> JavaScriptValue
{
  return try dateFunctions(in: runtime).constructor.callAsConstructor(argument: .number(milliseconds))
}

/// The largest magnitude, in milliseconds, a JS `Date` can represent (100,000,000 days from the epoch,
/// ECMAScript TimeClip); a value beyond it is an `Invalid Date`.
@usableFromInline
let maxJavaScriptDateMilliseconds: Double = 8_640_000_000_000_000

/// Builds a `Date` from a milliseconds value, applying the JS `Date` constructor's TimeClip: a non-finite
/// or out-of-range value throws, an in-range one is truncated toward zero. This keeps the number and string
/// branches faithful to `new Date(number)` and `new Date(str)`; the `Date` branch passes an already-clipped
/// `getTime()` through.
@usableFromInline
func dateFromMilliseconds(_ milliseconds: Double) throws -> Date {
  guard milliseconds.isFinite, milliseconds.magnitude <= maxJavaScriptDateMilliseconds else {
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
