// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 A wrapper class for worklets from react-native-worklets.
 */
public class Worklet: AnySerializable {
  internal let serializable: Serializable

  internal init(_ serializable: Serializable) throws {
    guard serializable.valueType == .worklet else {
      throw NotWorkletException(serializable.valueType)
    }
    self.serializable = serializable
  }

  public var valueType: SerializableValueType {
    return serializable.valueType
  }

  /**
   Schedules the worklet to be executed on the given runtime with arguments.
   */
  public func schedule(on runtime: WorkletRuntime, arguments: [Any] = []) {
    runtime.schedule(serializable.jsSerializable, arguments: arguments)
  }

  /**
   Executes the worklet synchronously on the given runtime with arguments.
   This blocks the current thread until the worklet completes.
   */
  public func execute(on runtime: WorkletRuntime, arguments: [Any] = []) {
    runtime.execute(serializable.jsSerializable, arguments: arguments)
  }

  // MARK: - AnyArgument

  public static func getDynamicType() -> AnyDynamicType {
    return DynamicWorkletType()
  }
}

internal final class NotWorkletException: GenericException<SerializableValueType>, @unchecked Sendable {
  override var reason: String {
    "Expected Serializable of type Worklet but got \(param)"
  }
}
