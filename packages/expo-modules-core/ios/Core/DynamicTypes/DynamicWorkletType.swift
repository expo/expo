//// Copyright 2025-present 650 Industries. All rights reserved.
//
//internal struct DynamicWorkletType: AnyDynamicType {
//  let serializableDynamicType = DynamicSerializableType(innerType: Worklet.self)
//
//  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
//    return Worklet.self == InnerType.self
//  }
//
//  func equals(_ type: AnyDynamicType) -> Bool {
//    return type is Self
//  }
//
//  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
//    guard let serializable = try serializableDynamicType.cast(jsValue: jsValue, appContext: appContext) as? Serializable else {
//      throw NotSerializableException(Worklet.self)
//    }
//    return try Worklet(serializable)
//  }
//
//  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
//    guard let worklet = value as? Worklet else {
//      throw Conversions.ConvertingException<Worklet>(value)
//    }
//    return worklet
//  }
//
//  var description: String {
//    return String(describing: Worklet.self)
//  }
//}
