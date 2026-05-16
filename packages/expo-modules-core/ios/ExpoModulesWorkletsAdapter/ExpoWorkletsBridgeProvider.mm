// Copyright 2025-present 650 Industries. All rights reserved.

#import "ExpoWorkletsBridgeProvider.h"
#import <ExpoModulesWorklets/EXJavaScriptSerializable.h>
#import <ExpoModulesWorklets/EXWorkletsProvider+Private.h>
#import <ExpoModulesCore/EXJSIConversions.h>

#include <memory>
#include <vector>
#include <worklets/SharedItems/Serializable.h>
#include <worklets/WorkletRuntime/WorkletRuntime.h>

namespace jsi = facebook::jsi;

// Opaque wrappers retained inside the main pod's `id` handles; only this
// translation unit unwraps them.
@interface ExpoWorkletsSerializableHandle : NSObject {
@public
  std::shared_ptr<worklets::Serializable> serializable;
}
@end

@implementation ExpoWorkletsSerializableHandle
@end

@interface ExpoWorkletsRuntimeHandle : NSObject {
@public
  std::weak_ptr<worklets::WorkletRuntime> runtime;
}
@end

@implementation ExpoWorkletsRuntimeHandle
@end

static EXSerializableValueType toObjCValueType(worklets::Serializable::ValueType type)
{
  switch (type) {
    case worklets::Serializable::ValueType::UndefinedType:
      return EXSerializableValueTypeUndefined;
    case worklets::Serializable::ValueType::NullType:
      return EXSerializableValueTypeNull;
    case worklets::Serializable::ValueType::BooleanType:
      return EXSerializableValueTypeBoolean;
    case worklets::Serializable::ValueType::NumberType:
      return EXSerializableValueTypeNumber;
    case worklets::Serializable::ValueType::BigIntType:
      return EXSerializableValueTypeBigInt;
    case worklets::Serializable::ValueType::StringType:
      return EXSerializableValueTypeString;
    case worklets::Serializable::ValueType::ObjectType:
      return EXSerializableValueTypeObject;
    case worklets::Serializable::ValueType::ArrayType:
      return EXSerializableValueTypeArray;
    case worklets::Serializable::ValueType::MapType:
      return EXSerializableValueTypeMap;
    case worklets::Serializable::ValueType::SetType:
      return EXSerializableValueTypeSet;
    case worklets::Serializable::ValueType::WorkletType:
      return EXSerializableValueTypeWorklet;
    case worklets::Serializable::ValueType::RemoteFunctionType:
      return EXSerializableValueTypeRemoteFunction;
    case worklets::Serializable::ValueType::HandleType:
      return EXSerializableValueTypeHandle;
    case worklets::Serializable::ValueType::HostObjectType:
      return EXSerializableValueTypeHostObject;
    case worklets::Serializable::ValueType::HostFunctionType:
      return EXSerializableValueTypeHostFunction;
    case worklets::Serializable::ValueType::ArrayBufferType:
      return EXSerializableValueTypeArrayBuffer;
    case worklets::Serializable::ValueType::TurboModuleLikeType:
      return EXSerializableValueTypeTurboModuleLike;
    case worklets::Serializable::ValueType::ImportType:
      return EXSerializableValueTypeImport;
    case worklets::Serializable::ValueType::SynchronizableType:
      return EXSerializableValueTypeSynchronizable;
    case worklets::Serializable::ValueType::CustomType:
      return EXSerializableValueTypeCustom;
    default:
      return EXSerializableValueTypeUndefined;
  }
}

static ExpoWorkletsRuntimeHandle *runtimeHandleFromOpaqueHandle(id runtimeHandle, NSString *action)
{
  if (![runtimeHandle isKindOfClass:ExpoWorkletsRuntimeHandle.class]) {
    NSLog(@"[ExpoModulesWorklets] Warning: Cannot %@ worklet; the runtime handle is invalid", action);
    return nil;
  }
  return (ExpoWorkletsRuntimeHandle *)runtimeHandle;
}

static ExpoWorkletsSerializableHandle *serializableHandleFromSerializable(EXJavaScriptSerializable *serializable, NSString *action)
{
  id handle = serializable.handle;
  if (![handle isKindOfClass:ExpoWorkletsSerializableHandle.class]) {
    NSLog(@"[ExpoModulesWorklets] Warning: Cannot %@ worklet; the serializable handle is invalid", action);
    return nil;
  }
  return (ExpoWorkletsSerializableHandle *)handle;
}

static jsi::Value callWorklet(jsi::Runtime &rt, std::shared_ptr<worklets::SerializableWorklet> worklet, NSArray *arguments)
{
  std::vector<jsi::Value> convertedArgs;
  convertedArgs.reserve(arguments.count);
  for (id arg in arguments) {
    convertedArgs.emplace_back(expo::convertObjCObjectToJSIValue(rt, arg));
  }
  auto func = worklet->toJSValue(rt).asObject(rt).asFunction(rt);
  return func.call(rt, (const jsi::Value *)convertedArgs.data(), convertedArgs.size());
}

@implementation ExpoWorkletsBridgeProvider

+ (void)load
{
  [EXWorkletsProviderRegistry setShared:[[ExpoWorkletsBridgeProvider alloc] init]];
}

- (BOOL)isSerializableWithRuntimePointer:(void *)runtimePointer
                            valuePointer:(const void *)valuePointer
{
  jsi::Runtime &rt = *reinterpret_cast<jsi::Runtime *>(runtimePointer);
  const jsi::Value &value = *reinterpret_cast<const jsi::Value *>(valuePointer);

  if (!value.isObject()) {
    return NO;
  }
  jsi::Object obj = value.getObject(rt);
  return obj.hasProperty(rt, "__serializableRef") && obj.hasNativeState(rt);
}

- (nullable EXJavaScriptSerializable *)extractSerializableWithRuntimePointer:(void *)runtimePointer
                                                                valuePointer:(const void *)valuePointer
{
  if (![self isSerializableWithRuntimePointer:runtimePointer valuePointer:valuePointer]) {
    return nil;
  }

  jsi::Runtime &rt = *reinterpret_cast<jsi::Runtime *>(runtimePointer);
  const jsi::Value &value = *reinterpret_cast<const jsi::Value *>(valuePointer);

  auto serializable = worklets::extractSerializableOrThrow(rt, value);

  ExpoWorkletsSerializableHandle *handle = [[ExpoWorkletsSerializableHandle alloc] init];
  handle->serializable = serializable;

  return [[EXJavaScriptSerializable alloc] initWithHandle:handle
                                                valueType:toObjCValueType(serializable->valueType())];
}

- (nullable id)workletRuntimeHandleForRawPointer:(void *)rawPointer
{
  jsi::Runtime *jsiRuntime = reinterpret_cast<jsi::Runtime *>(rawPointer);
  auto weakRuntime = worklets::WorkletRuntime::getWeakRuntimeFromJSIRuntime(*jsiRuntime);
  auto locked = weakRuntime.lock();
  if (!locked) {
    NSLog(@"[ExpoModulesWorklets] Warning: Cannot create WorkletRuntimeHandle; the jsi::Runtime is not associated with a live worklet runtime");
    return nil;
  }
  ExpoWorkletsRuntimeHandle *handle = [[ExpoWorkletsRuntimeHandle alloc] init];
  handle->runtime = weakRuntime;
  return handle;
}

- (void)scheduleWorkletWithRuntimeHandle:(id)runtimeHandle
                            serializable:(EXJavaScriptSerializable *)serializable
                               arguments:(NSArray *)arguments
{
  ExpoWorkletsRuntimeHandle *runtimeWrapper = runtimeHandleFromOpaqueHandle(runtimeHandle, @"schedule");
  ExpoWorkletsSerializableHandle *serializableWrapper = serializableHandleFromSerializable(serializable, @"schedule");
  if (!runtimeWrapper || !serializableWrapper) {
    return;
  }

  auto workletRuntime = runtimeWrapper->runtime.lock();
  if (!workletRuntime) {
    NSLog(@"[ExpoModulesWorklets] Warning: Cannot schedule worklet; the worklet runtime has been destroyed");
    return;
  }

  auto worklet = std::dynamic_pointer_cast<worklets::SerializableWorklet>(serializableWrapper->serializable);
  if (!worklet) {
    NSLog(@"[ExpoModulesWorklets] Warning: Cannot schedule worklet; the given serializable is not a worklet");
    return;
  }

  workletRuntime->schedule([worklet, arguments](jsi::Runtime &rt) {
    callWorklet(rt, worklet, arguments);
  });
}

- (void)executeWorkletWithRuntimeHandle:(id)runtimeHandle
                           serializable:(EXJavaScriptSerializable *)serializable
                              arguments:(NSArray *)arguments
{
  ExpoWorkletsRuntimeHandle *runtimeWrapper = runtimeHandleFromOpaqueHandle(runtimeHandle, @"execute");
  ExpoWorkletsSerializableHandle *serializableWrapper = serializableHandleFromSerializable(serializable, @"execute");
  if (!runtimeWrapper || !serializableWrapper) {
    return;
  }

  auto workletRuntime = runtimeWrapper->runtime.lock();
  if (!workletRuntime) {
    NSLog(@"[ExpoModulesWorklets] Warning: Cannot execute worklet; the worklet runtime has been destroyed");
    return;
  }

  auto worklet = std::dynamic_pointer_cast<worklets::SerializableWorklet>(serializableWrapper->serializable);
  if (!worklet) {
    NSLog(@"[ExpoModulesWorklets] Warning: Cannot execute worklet; the given serializable is not a worklet");
    return;
  }

  workletRuntime->executeSync([worklet, arguments](jsi::Runtime &rt) -> jsi::Value {
    return callWorklet(rt, worklet, arguments);
  });
}

@end
