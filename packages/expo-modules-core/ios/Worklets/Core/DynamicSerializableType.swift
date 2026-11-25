// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import ExpoModulesCore

internal struct DynamicSerializableType: AnyDynamicType {
  let innerType: any AnySerializable.Type

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return innerType == InnerType.self
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    if let serializableType = type as? Self {
      return serializableType.innerType == innerType
    }
    return false
  }

  func cast(jsValue: borrowing JavaScriptValue, appContext: AppContext) throws -> Any {
    return Serializable(try extractSerializable(jsValue, in: try appContext.runtime, as: innerType))
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    guard let serializable = value as? Serializable else {
      throw Conversions.ConvertingException<Serializable>(value)
    }
    return serializable
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    return try JavaScriptValue.from(value, runtime: appContext.runtime)
  }

  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any {
    return result
  }

  var description: String {
    return String(describing: innerType)
  }
}

/// Extracts the serializable of `react-native-worklets` that the JS value holds.
internal func extractSerializable(
  _ jsValue: borrowing JavaScriptValue,
  in runtime: borrowing JavaScriptRuntime,
  as type: any AnySerializable.Type
) throws -> JavaScriptSerializable {
  let jsSerializable: JavaScriptSerializable? = runtime.withUnsafePointee { runtimePointee in
    return jsValue.withUnsafePointee { valuePointee in
      return SerializableExtractor.extractSerializable(
        runtimePointer: runtimePointee,
        valuePointer: valuePointee
      )
    }
  }
  guard let jsSerializable else {
    // Adapter not linked → the extractor returns nil for every value; give an actionable error.
    if WorkletsProviderRegistry.shared == nil {
      throw WorkletsNotInstalledException()
    }
    throw NotSerializableException(type)
  }
  return jsSerializable
}

internal final class NotSerializableException: GenericException<AnySerializable.Type>, @unchecked Sendable {
  override var reason: String {
    "Given argument is not an instance of \(param)"
  }
}
