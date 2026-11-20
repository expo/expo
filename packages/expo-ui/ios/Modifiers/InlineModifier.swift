// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal typealias StableContent = StableViewModifier.Content

/**
 A modifier written as a function, registered with `ViewModifierRegistry.registerModifierInline`.
 It reads its fields from `ModifierParams` and returns the modified content.
 */
internal typealias InlineModifier = @MainActor (StableContent, ModifierParams) throws -> AnyView

/**
 Builds the body of an inline modifier like `@ViewBuilder`, but erases every branch to `AnyView`.
 So the branches of `if`, `switch` and `#available` don't create `_ConditionalContent` types.
 */
@resultBuilder
internal enum AnyViewBuilder {
  static func buildExpression<V: View>(_ view: V) -> AnyView { AnyView(view) }
  static func buildExpression(_ view: AnyView) -> AnyView { view }
  static func buildBlock() -> AnyView { AnyView(EmptyView()) }
  static func buildPartialBlock(first: AnyView) -> AnyView { first }
  static func buildPartialBlock(accumulated: AnyView, next: AnyView) -> AnyView { AnyView(TupleView((accumulated, next))) }
  static func buildEither(first: AnyView) -> AnyView { first }
  static func buildEither(second: AnyView) -> AnyView { second }
  static func buildOptional(_ view: AnyView?) -> AnyView { view ?? AnyView(EmptyView()) }
  static func buildLimitedAvailability(_ view: AnyView) -> AnyView { view }
}

internal final class ModifierFieldException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Invalid value for modifier field '\(param)'"
  }
}

/**
 The params of an inline modifier. It reads each field with the same rules as `@Field`.
 */
internal struct ModifierParams {
  let raw: [String: Any]
  let appContext: AppContext

  // A missing key keeps the default, and a value of the wrong type throws.
  // One shared copy for every field type, instead of one specialized copy per type.
  @_semantics("optimize.sil.specialize.generic.never")
  func readArgument<T: AnyArgument>(_ key: String, into value: inout T) throws {
    guard raw.keys.contains(key) else {
      return
    }
    guard let newValue = try T.getDynamicType().cast(raw[key], appContext: appContext) as? T else {
      throw ModifierFieldException(key)
    }
    value = newValue
  }

  @inline(__always)
  func value<T: AnyArgument>(_ key: String, _ fallback: T) throws -> T {
    var value = fallback
    try readArgument(key, into: &value)
    return value
  }
}
