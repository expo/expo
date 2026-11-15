// Copyright 2026-present 650 Industries. All rights reserved.

internal import React
import ExpoModulesJSI

/**
 What `expo.__createNativeViewComponent` needs to create the React component of a view of Expo Modules v2.
 */
internal struct NativeViewComponentConfig: Sendable {
  /// The name that the view is registered under in React Native.
  let name: String

  /// The name that React DevTools and errors show. It doesn't have to be unique.
  let displayName: String

  let propNames: [String]
  let eventNames: [String]

  init(viewType: any AnyNativeView.Type, componentName: String) {
    self.name = componentName
    self.displayName = unqualifiedTypeName(viewType)
    self.propNames = viewType.propNames
    self.eventNames = viewType.eventNames
  }
}

/**
 Creates the React components of the views of Expo Modules v2 with the JS factory that expo-modules-core
 installs as `expo.__createNativeViewComponent`.
 */
internal enum NativeViewComponentFactory {
  /**
   Returns whether the runtime has the factory. Only the React runtime has it, the UI runtime doesn't.
   */
  @JavaScriptActor
  static func isAvailable(in runtime: JavaScriptRuntime) -> Bool {
    return factory(in: runtime) != nil
  }

  /**
   Calls the factory with the name, the display name, the valid attributes and the direct event types
   of the view, and returns the component.
   */
  @JavaScriptActor
  static func create(_ config: NativeViewComponentConfig, in runtime: JavaScriptRuntime) throws -> JavaScriptValue {
    guard let factory = factory(in: runtime) else {
      throw NativeViewComponentFactoryMissingException(config.displayName)
    }
    let validAttributes = runtime.createObject()
    let trueValue = JavaScriptValue.true()
    for propName in config.propNames {
      validAttributes.setProperty(propName, value: trueValue)
    }
    let directEventTypes = runtime.createObject()
    let registrationNamePropName = JavaScriptPropNameID.cached(runtime, "registrationName")
    for eventName in config.eventNames {
      guard let normalizedEventName = RCTNormalizeInputEventName(eventName) else {
        continue
      }
      let eventType = runtime.createObject()
      eventType.setProperty(registrationNamePropName, value: JavaScriptValue.representing(value: eventName, in: runtime))
      directEventTypes.setProperty(normalizedEventName, eventType)
    }
    // TODO: Pass the view functions once `@ExpoView` views can have them.
    let arguments = JavaScriptValuesBuffer.allocate(in: runtime, capacity: 4)
    try arguments.emplace(config.name, at: 0, in: runtime)
    try arguments.emplace(config.displayName, at: 1, in: runtime)
    arguments.emplace(validAttributes.takeValue(), at: 2)
    arguments.emplace(directEventTypes.takeValue(), at: 3)
    return try factory.call(arguments: arguments)
  }

  /**
   Returns the factory function, or `nil` when the runtime doesn't have it.
   */
  @JavaScriptActor
  private static func factory(in runtime: JavaScriptRuntime) -> JavaScriptFunction? {
    let expo = runtime.global().getProperty(JavaScriptPropNameID.cached(runtime, "expo"))
    guard expo.isObject() else {
      return nil
    }
    let factory = expo.getObject().getProperty(JavaScriptPropNameID.cached(runtime, "__createNativeViewComponent"))
    return factory.isFunction() ? factory.getFunction() : nil
  }
}

internal final class NativeViewComponentFactoryMissingException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Cannot create the component of the native view '\(param)', because 'expo.__createNativeViewComponent' isn't defined. Make sure that expo-modules-core is imported before the view is used"
  }
}
