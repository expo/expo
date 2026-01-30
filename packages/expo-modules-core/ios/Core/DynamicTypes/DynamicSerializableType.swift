//// Copyright 2025-present 650 Industries. All rights reserved.
//
//internal struct DynamicSerializableType: AnyDynamicType {
//  let innerType: any AnySerializable.Type
//
//  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
//    return innerType == InnerType.self
//  }
//
//  func equals(_ type: AnyDynamicType) -> Bool {
//    if let serializableType = type as? Self {
//      return serializableType.innerType == innerType
//    }
//    return false
//  }
//
//  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
//    guard let runtime = appContext._runtime else {
//      throw Exceptions.RuntimeLost()
//    }
//    guard let jsSerializable = SerializableExtractor.extractSerializable(jsValue, runtime: runtime) else {
//      throw NotSerializableException(innerType)
//    }
//    return Serializable(jsSerializable)
//  }
//
//  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
//    guard let serializable = value as? Serializable else {
//      throw Conversions.ConvertingException<Serializable>(value)
//    }
//    return serializable
//  }
//
//  var description: String {
//    return String(describing: innerType)
//  }
//}
//
//internal final class NotSerializableException: GenericException<AnySerializable.Type>, @unchecked Sendable {
//  override var reason: String {
//    "Given argument is not an instance of \(param)"
//  }
//}
