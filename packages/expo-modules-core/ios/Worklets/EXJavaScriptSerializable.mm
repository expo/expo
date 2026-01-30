//// Copyright 2025-present 650 Industries. All rights reserved.
//
//#import <ExpoModulesCore/EXJavaScriptSerializable.h>
//
//#if WORKLETS_ENABLED
//
//#include <worklets/SharedItems/Serializable.h>
//
//EXSerializableValueType toObjCValueType(worklets::Serializable::ValueType type) {
//  switch (type) {
//    case worklets::Serializable::ValueType::UndefinedType:
//      return EXSerializableValueTypeUndefined;
//    case worklets::Serializable::ValueType::NullType:
//      return EXSerializableValueTypeNull;
//    case worklets::Serializable::ValueType::BooleanType:
//      return EXSerializableValueTypeBoolean;
//    case worklets::Serializable::ValueType::NumberType:
//      return EXSerializableValueTypeNumber;
//    case worklets::Serializable::ValueType::BigIntType:
//      return EXSerializableValueTypeBigInt;
//    case worklets::Serializable::ValueType::StringType:
//      return EXSerializableValueTypeString;
//    case worklets::Serializable::ValueType::ObjectType:
//      return EXSerializableValueTypeObject;
//    case worklets::Serializable::ValueType::ArrayType:
//      return EXSerializableValueTypeArray;
//    case worklets::Serializable::ValueType::MapType:
//      return EXSerializableValueTypeMap;
//    case worklets::Serializable::ValueType::SetType:
//      return EXSerializableValueTypeSet;
//    case worklets::Serializable::ValueType::WorkletType:
//      return EXSerializableValueTypeWorklet;
//    case worklets::Serializable::ValueType::RemoteFunctionType:
//      return EXSerializableValueTypeRemoteFunction;
//    case worklets::Serializable::ValueType::HandleType:
//      return EXSerializableValueTypeHandle;
//    case worklets::Serializable::ValueType::HostObjectType:
//      return EXSerializableValueTypeHostObject;
//    case worklets::Serializable::ValueType::HostFunctionType:
//      return EXSerializableValueTypeHostFunction;
//    case worklets::Serializable::ValueType::ArrayBufferType:
//      return EXSerializableValueTypeArrayBuffer;
//    case worklets::Serializable::ValueType::TurboModuleLikeType:
//      return EXSerializableValueTypeTurboModuleLike;
//    case worklets::Serializable::ValueType::ImportType:
//      return EXSerializableValueTypeImport;
//    case worklets::Serializable::ValueType::SynchronizableType:
//      return EXSerializableValueTypeSynchronizable;
//    case worklets::Serializable::ValueType::CustomType:
//      return EXSerializableValueTypeCustom;
//  }
//}
//
//@implementation EXJavaScriptSerializable {
//  __weak EXJavaScriptRuntime *_runtime;
//  std::shared_ptr<worklets::Serializable> _serializable;
//}
//
//- (nonnull instancetype)initWithSerializable:(std::shared_ptr<worklets::Serializable>)serializable
//                                     runtime:(nonnull EXJavaScriptRuntime *)runtime
//{
//  if (self = [super init]) {
//    _runtime = runtime;
//    _serializable = serializable;
//    _valueType = toObjCValueType(serializable->valueType());
//  }
//  return self;
//}
//
//- (std::shared_ptr<worklets::Serializable>)getSerializable
//{
//  return _serializable;
//}
//
//@end
//
//#else
//
//@implementation EXJavaScriptSerializable
//
//- (EXSerializableValueType)valueType
//{
//  return EXSerializableValueTypeUndefined;
//}
//
//@end
//
//#endif
