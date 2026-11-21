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
 The `modifiers` prop of a view of the Expo Modules API 2.0. It decodes each modifier on the JavaScript thread, when the
 prop changes. A v1 view creates its modifiers from dictionaries each time its body runs.
 */
public struct ModifierList: JavaScriptDecodable {
  let modifiers: [DecodedModifier]

  @JavaScriptActor
  public static func decode(
    _ value: borrowing JavaScriptUnownedValue,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> ModifierList {
    let value = value.copied(in: runtime)
    guard value.isObject() else {
      return ModifierList(modifiers: [])
    }
    let object = value.getObject()
    guard object.isArray() else {
      return ModifierList(modifiers: [])
    }
    let array = object.getArray()
    var modifiers: [DecodedModifier] = []
    modifiers.reserveCapacity(array.length)

    for index in 0..<array.length {
      let element = try array.getValue(at: index)
      guard element.isObject() else {
        continue
      }
      let type = element.getObject().getProperty("$type")
      guard type.isString() else {
        continue
      }
      // Like a v1 view, skip a modifier that is not registered or that fails to decode.
      switch ViewModifierRegistry.shared.registrations[type.getString()] {
      case .type(let modifierType):
        if let modifier = try? modifierType.decode(element, in: runtime) {
          modifiers.append(.modifier(modifier))
        }
      case .factory:
        if let params = try? foundationValue(of: element) as? [String: Any] {
          modifiers.append(.params(params))
        }
      case nil:
        continue
      }
    }
    return ModifierList(modifiers: modifiers)
  }
}

internal enum DecodedModifier {
  /// A modifier registered by its type, decoded from its JavaScript object.
  case modifier(any ViewModifier)
  /// The params of a modifier registered with the deprecated factory, which creates the modifier when the view applies it.
  case params([String: Any])
}

/**
 Converts a JavaScript value to the value that React Native gives the props of v1 views (`jsi::dynamicFromValue`):
 `NSNumber` for numbers and booleans, `NSNull` for `null` and functions, and no key for an `undefined` property.
 The deprecated modifier factories depend on it. For example, the cast of a shared object id to `Int` fails for a `Double`.
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
    let modifiers = props.modifiers?.modifiers

    return UniversalPercentageParentBoundary(content: self)
      .applyAccessibilityIdentifier(props.testID)
      .applyDecodedModifiers(modifiers, appContext: appContext, eventDispatcher: eventDispatcher)
      // A user modifier such as `onGeometryChange` hides the layout value a universal stack reads.
      // Set it again outside every modifier.
      .layoutValue(key: UniversalLayoutDimensionsKey.self, value: universalLayoutDimensions(from: modifiers))
  }

  @ViewBuilder
  fileprivate func applyDecodedModifiers(
    _ modifiers: [DecodedModifier]?,
    appContext: AppContext?,
    eventDispatcher: EventDispatcher
  ) -> some View {
    if let modifiers {
      modifiers.reduce(AnyView(self)) { view, modifier in
        AnyView(view.modifier(AppliedModifier(modifier: modifier, appContext: appContext, eventDispatcher: eventDispatcher)))
      }
    } else {
      self
    }
  }
}

private struct AppliedModifier: ViewModifier {
  let modifier: DecodedModifier
  weak var appContext: AppContext?
  let eventDispatcher: EventDispatcher

  func body(content: Content) -> some View {
    if let viewModifier {
      content.modifier(AnyViewModifier(viewModifier))
    } else {
      content
    }
  }

  private var viewModifier: (any ViewModifier)? {
    switch modifier {
    case .modifier(let modifier):
      return withEventDispatcher(modifier, eventDispatcher)
    case .params(let params):
      guard let type = params["$type"] as? String, let appContext else {
        return nil
      }
      return try? ViewModifierRegistry.shared.createModifier(
        type,
        params: params,
        appContext: appContext,
        eventDispatcher: eventDispatcher
      )
    }
  }
}
