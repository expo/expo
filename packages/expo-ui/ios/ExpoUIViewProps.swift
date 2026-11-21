// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

/**
 The props that every view of `@expo/ui` built with the Expo Modules API 2.0 has, like `UIBaseViewProps` for v1 views.
 A view gets them with `@ViewProps(extending: ExpoUIViewProps.self)` and applies them with `applyExpoUIViewProps`.
 */
@ViewProps
public struct ExpoUIViewProps {
  var testID: String?
  var modifiers: ModifierList?
  var onGlobalEvent: (ModifierEvent) -> Void
}

/**
 The `modifiers` prop of a view of the Expo Modules API 2.0. It holds the same dictionaries as the `modifiers` prop of
 v1 views, so the modifier factories of `ViewModifierRegistry` read them the same way.
 */
public struct ModifierList: JavaScriptDecodable {
  let configs: ModifierArray

  @JavaScriptActor
  public static func decode(
    _ value: borrowing JavaScriptUnownedValue,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> ModifierList {
    let elements = try foundationValue(of: value.copied(in: runtime)) as? [Any] ?? []
    return ModifierList(configs: elements.compactMap { $0 as? ModifierType })
  }
}

/**
 Converts a JavaScript value to the value that React Native gives the props of v1 views (`jsi::dynamicFromValue`):
 `NSNumber` for numbers and booleans, `NSNull` for `null` and functions, and no key for an `undefined` property.
 The modifier factories depend on it. For example, the cast of a shared object id to `Int` fails for a `Double`.
 */
@JavaScriptActor
private func foundationValue(of value: borrowing JavaScriptValue) throws -> Any {
  if value.isNumber() {
    return NSNumber(value: value.getDouble())
  }
  if value.isBool() {
    return NSNumber(value: value.getBool())
  }
  if value.isString() {
    return value.getString()
  }
  guard value.isObject() else {
    return NSNull()
  }
  let object = value.getObject()
  if object.isArray() {
    let array = object.getArray()
    var elements: [Any] = []
    elements.reserveCapacity(array.length)
    for index in 0..<array.length {
      elements.append(try foundationValue(of: array.getValue(at: index)))
    }
    return elements
  }
  if object.isFunction() {
    return NSNull()
  }
  var dictionary: [String: Any] = [:]
  for name in object.getPropertyNames() {
    let property = object.getProperty(name)
    if !property.isUndefined() {
      dictionary[name] = try foundationValue(of: property)
    }
  }
  return dictionary
}

/**
 The payload of the `onGlobalEvent` event: `{ [modifierType]: payload }`. `createViewModifierEventListener` in
 JavaScript calls the listener of each modifier type in it.
 */
public struct ModifierEvent: JavaScriptEncodable {
  let payload: [String: Any]

  @JavaScriptActor
  public static func encode(_ value: consuming ModifierEvent, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptValue
  {
    return try JavaScriptValue.encodeAnyDictionary(value.payload, in: runtime)
  }
}

extension View {
  /**
   Applies the props of `ExpoUIViewProps` to a view of the Expo Modules API 2.0, as `UIBaseView` does for v1 views.
   Core places the SwiftUI views of 2.0 at a zero content origin, so this doesn't publish one.
   */
  func applyExpoUIViewProps(_ props: ExpoUIViewProps, appContext: AppContext?) -> some View {
    // The modifiers dispatch their events through a v1 `EventDispatcher`, which sends them to the `onGlobalEvent` prop.
    let eventDispatcher = EventDispatcher()
    let onGlobalEvent = props.onGlobalEvent
    eventDispatcher.onEventSent = { payload in
      onGlobalEvent(ModifierEvent(payload: payload))
    }
    let modifiers = props.modifiers?.configs

    return UniversalPercentageParentBoundary(content: self)
      .applyAccessibilityIdentifier(props.testID)
      .applyModifiers(modifiers, appContext: appContext, globalEventDispatcher: eventDispatcher)
      // A user modifier such as `onGeometryChange` hides the layout value a universal stack reads.
      // Set it again outside every modifier.
      .layoutValue(key: UniversalLayoutDimensionsKey.self, value: universalLayoutDimensions(from: modifiers))
  }
}
