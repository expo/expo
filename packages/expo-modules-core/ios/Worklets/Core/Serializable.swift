// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 A protocol for all serializable types from react-native-worklets.
 */
public protocol AnySerializable: AnyArgument {
  var valueType: SerializableValueType { get }
}

extension AnySerializable {
  public static func getDynamicType() -> AnyDynamicType {
    return DynamicSerializableType(innerType: Self.self)
  }
}

public class Serializable: AnySerializable {
  let jsSerializable: JavaScriptSerializable

  public var valueType: SerializableValueType {
    return jsSerializable.valueType
  }

  required init(_ jsSerializable: JavaScriptSerializable) {
    self.jsSerializable = jsSerializable
  }
}
