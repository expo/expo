// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/// The props of a view of Expo Modules v2. The `@ViewProps` macro conforms a struct to it and
/// generates the requirements. `init()` is the one that the author declares, the one that Swift
/// synthesizes, or the one that the macro generates (for example, when an event prop has no initial
/// value or the type is `public`).
///
/// Core starts from `Self()` when React creates a view, because React sends only the props that the
/// user set. A prop that React removes goes back to its value in `Self()`.
public protocol AnyViewProps {
  /// The names of the value props, whose raw values are the prop names in JavaScript.
  associatedtype PropName: RawRepresentable, CaseIterable where PropName.RawValue == String

  /// A set of value props, one bit for each prop in declaration order.
  associatedtype PropSet: OptionSet, Sendable where PropSet.RawValue == UInt64, PropSet.Element == PropSet

  /// All value props, the set of changed props when the props are applied for the first time.
  static var allProps: PropSet { get }

  /// The names of the event props.
  static var _eventNames: [String] { get }

  /// Returns the set with only the given prop.
  static func propSet(for name: PropName) -> PropSet

  init()

  /// Decodes the given JavaScript value into the prop with the given name. `null` and `undefined` reset
  /// the prop to its value in `Self()`.
  @JavaScriptActor
  mutating func _decode(
    _ name: PropName,
    from value: borrowing JavaScriptUnownedValue,
    in runtime: borrowing JavaScriptRuntime
  ) throws
}

extension AnyViewProps {
  /// Decodes a view prop. `@ViewProps` calls it from `_decode(_:from:in:)` as `Self._decodeViewProp`, so a
  /// prop with the same name doesn't hide it. The type comes from the property that the value is assigned to.
  @JavaScriptActor
  @inlinable
  public static func _decodeViewProp<T: JavaScriptDecodable>(
    _ value: borrowing JavaScriptUnownedValue,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> T {
    return try T.decode(value, in: runtime)
  }
}
