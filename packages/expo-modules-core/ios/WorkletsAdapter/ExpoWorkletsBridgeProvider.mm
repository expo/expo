// Copyright 2025-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ExpoModulesJSI/EXJavaScriptValue.h>
#import <ExpoModulesJSI/EXJavaScriptRuntime.h>
#import <ExpoModulesJSI/EXJSIConversions.h>

#import <ExpoModulesWorklets/EXJavaScriptSerializable.h>
#import <ExpoModulesWorklets/EXWorkletRuntime.h>
#import <ExpoModulesWorklets/EXWorkletsProvider.h>

#include <ReactCommon/CallInvoker.h>
#include <worklets/SharedItems/Serializable.h>
#include <worklets/WorkletRuntime/WorkletRuntime.h>

namespace react = facebook::react;

#pragma mark - CallInvoker routing through the worklet runtime

namespace {

// Schedules JS-thread work through the installed `worklets::WorkletRuntime`
// instead of React Native's default runtime scheduler. Hosted here (not in
// its own translation unit) because it's only used by the `EXWorkletRuntime`
// constructed below.
class WorkletJSCallInvoker : public react::CallInvoker {
public:
  explicit WorkletJSCallInvoker(std::weak_ptr<worklets::WorkletRuntime> workletRuntimeHolder)
    : workletRuntimeHolder_(std::move(workletRuntimeHolder)) {}

  void invokeAsync(react::CallFunc &&func) noexcept override
  {
    if (auto workletRuntime = workletRuntimeHolder_.lock()) {
      workletRuntime->schedule(std::move(func));
    }
  }

  void invokeSync(react::CallFunc &&func) override
  {
    if (auto workletRuntime = workletRuntimeHolder_.lock()) {
      workletRuntime->executeSync([func = std::move(func)](jsi::Runtime &rt) -> jsi::Value {
        func(rt);
        return jsi::Value::undefined();
      });
    }
  }

private:
  std::weak_ptr<worklets::WorkletRuntime> workletRuntimeHolder_;
};

} // namespace

#pragma mark - Private serializable handle

// Private ObjC container holding a `std::shared_ptr<worklets::Serializable>`
// inside an `NSObject` façade. Stashed in
// `EXJavaScriptSerializable.opaqueHandle` so the main xcframework never has
// to know about `worklets::*` types.
@interface ExpoWorkletsSerializableHandle : NSObject
- (nonnull instancetype)initWithSerializable:(std::shared_ptr<worklets::Serializable>)serializable NS_DESIGNATED_INITIALIZER;
- (nonnull instancetype)init NS_UNAVAILABLE;
- (std::shared_ptr<worklets::Serializable>)serializable;
@end

@implementation ExpoWorkletsSerializableHandle {
  std::shared_ptr<worklets::Serializable> _serializable;
}

- (nonnull instancetype)initWithSerializable:(std::shared_ptr<worklets::Serializable>)serializable
{
  if (self = [super init]) {
    _serializable = std::move(serializable);
  }
  return self;
}

- (std::shared_ptr<worklets::Serializable>)serializable
{
  return _serializable;
}

@end

#pragma mark - Helpers

static EXSerializableValueType EXSerializableValueTypeFromWorklets(worklets::Serializable::ValueType type)
{
  switch (type) {
    case worklets::Serializable::ValueType::UndefinedType:       return EXSerializableValueTypeUndefined;
    case worklets::Serializable::ValueType::NullType:            return EXSerializableValueTypeNull;
    case worklets::Serializable::ValueType::BooleanType:         return EXSerializableValueTypeBoolean;
    case worklets::Serializable::ValueType::NumberType:          return EXSerializableValueTypeNumber;
    case worklets::Serializable::ValueType::BigIntType:          return EXSerializableValueTypeBigInt;
    case worklets::Serializable::ValueType::StringType:          return EXSerializableValueTypeString;
    case worklets::Serializable::ValueType::ObjectType:          return EXSerializableValueTypeObject;
    case worklets::Serializable::ValueType::ArrayType:           return EXSerializableValueTypeArray;
    case worklets::Serializable::ValueType::MapType:             return EXSerializableValueTypeMap;
    case worklets::Serializable::ValueType::SetType:             return EXSerializableValueTypeSet;
    case worklets::Serializable::ValueType::WorkletType:         return EXSerializableValueTypeWorklet;
    case worklets::Serializable::ValueType::RemoteFunctionType:  return EXSerializableValueTypeRemoteFunction;
    case worklets::Serializable::ValueType::HandleType:          return EXSerializableValueTypeHandle;
    case worklets::Serializable::ValueType::HostObjectType:      return EXSerializableValueTypeHostObject;
    case worklets::Serializable::ValueType::HostFunctionType:    return EXSerializableValueTypeHostFunction;
    case worklets::Serializable::ValueType::ArrayBufferType:     return EXSerializableValueTypeArrayBuffer;
    case worklets::Serializable::ValueType::TurboModuleLikeType: return EXSerializableValueTypeTurboModuleLike;
    case worklets::Serializable::ValueType::ImportType:          return EXSerializableValueTypeImport;
    case worklets::Serializable::ValueType::SynchronizableType:  return EXSerializableValueTypeSynchronizable;
    case worklets::Serializable::ValueType::CustomType:          return EXSerializableValueTypeCustom;
    default:                                                      return EXSerializableValueTypeUndefined;
  }
}

static bool isSerializableJSValue(jsi::Runtime &rt, const jsi::Value &jsValue)
{
  if (!jsValue.isObject()) {
    return false;
  }
  jsi::Object obj = jsValue.getObject(rt);
  return obj.hasProperty(rt, "__serializableRef") && obj.hasNativeState(rt);
}

static std::shared_ptr<worklets::SerializableWorklet> extractWorklet(EXJavaScriptSerializable *serializable)
{
  id opaqueHandle = serializable.opaqueHandle;
  if (![opaqueHandle isKindOfClass:[ExpoWorkletsSerializableHandle class]]) {
    return nullptr;
  }
  auto raw = [(ExpoWorkletsSerializableHandle *)opaqueHandle serializable];
  return std::dynamic_pointer_cast<worklets::SerializableWorklet>(raw);
}

static std::shared_ptr<worklets::WorkletRuntime> lockWorkletRuntime(EXWorkletRuntime *runtime)
{
  jsi::Runtime *jsRuntime = [runtime get];
  if (jsRuntime == nullptr) {
    return nullptr;
  }
  return worklets::WorkletRuntime::getWeakRuntimeFromJSIRuntime(*jsRuntime).lock();
}

#pragma mark - Bridge provider

// Discovered by `ExpoWorkletsDiscovery` via `NSClassFromString`. The
// empty `+load` below forces the linker to keep the class registered
// with the ObjC runtime even when nothing references it statically.
@interface ExpoWorkletsBridgeProvider : NSObject <EXWorkletsProvider>
@end

@implementation ExpoWorkletsBridgeProvider

+ (void)load {}

- (nullable EXJavaScriptSerializable *)extractSerializableFrom:(nonnull EXJavaScriptValue *)value
                                                        runtime:(nonnull EXJavaScriptRuntime *)runtime
{
  jsi::Value jsValue = [value get];
  jsi::Runtime *rt = [runtime get];

  if (!isSerializableJSValue(*rt, jsValue)) {
    return nil;
  }

  auto serializable = worklets::extractSerializableOrThrow(*rt, jsValue);
  ExpoWorkletsSerializableHandle *handle = [[ExpoWorkletsSerializableHandle alloc] initWithSerializable:serializable];
  EXSerializableValueType valueType = EXSerializableValueTypeFromWorklets(serializable->valueType());

  return [[EXJavaScriptSerializable alloc] initWithOpaqueHandle:handle valueType:valueType];
}

- (nullable EXWorkletRuntime *)createWorkletRuntimeFromValue:(nonnull EXJavaScriptValue *)jsValue
                                                     runtime:(nonnull EXJavaScriptRuntime *)runtime
{
  jsi::Value rawValue = [jsValue get];
  jsi::Runtime *rawRuntime = [runtime get];

  if (!rawValue.isObject()) {
    return nil;
  }

  jsi::Object workletRuntimeObject = rawValue.getObject(*rawRuntime);
  if (!workletRuntimeObject.isArrayBuffer(*rawRuntime)) {
    return nil;
  }

  jsi::ArrayBuffer workletRuntimeArrayBuffer = workletRuntimeObject.getArrayBuffer(*rawRuntime);
  if (workletRuntimeArrayBuffer.size(*rawRuntime) != sizeof(uintptr_t *)) {
    return nil;
  }

  jsi::Runtime *jsRuntime = reinterpret_cast<jsi::Runtime *>(
    *reinterpret_cast<uintptr_t **>(workletRuntimeArrayBuffer.data(*rawRuntime))
  );
  if (jsRuntime == nullptr) {
    return nil;
  }

  auto weakWorkletRuntime = worklets::WorkletRuntime::getWeakRuntimeFromJSIRuntime(*jsRuntime);
  auto workletRuntime = weakWorkletRuntime.lock();
  if (!workletRuntime) {
    return nil;
  }

  auto callInvoker = std::make_shared<WorkletJSCallInvoker>(weakWorkletRuntime);
  return [[EXWorkletRuntime alloc] initWithRuntime:workletRuntime->getJSIRuntime()
                                       callInvoker:callInvoker];
}

- (void)schedule:(nonnull EXJavaScriptSerializable *)serializable
         runtime:(nonnull EXWorkletRuntime *)runtime
{
  auto workletRuntime = lockWorkletRuntime(runtime);
  auto worklet = extractWorklet(serializable);
  if (!workletRuntime || !worklet) {
    return;
  }
  workletRuntime->schedule(worklet);
}

- (void)execute:(nonnull EXJavaScriptSerializable *)serializable
        runtime:(nonnull EXWorkletRuntime *)runtime
{
  auto workletRuntime = lockWorkletRuntime(runtime);
  auto worklet = extractWorklet(serializable);
  if (!workletRuntime || !worklet) {
    return;
  }
  workletRuntime->runSync(worklet);
}

- (void)schedule:(nonnull EXJavaScriptSerializable *)serializable
         runtime:(nonnull EXWorkletRuntime *)runtime
       arguments:(nonnull NSArray *)arguments
{
  auto workletRuntime = lockWorkletRuntime(runtime);
  auto worklet = extractWorklet(serializable);
  if (!workletRuntime || !worklet) {
    return;
  }
  workletRuntime->schedule([worklet, arguments](jsi::Runtime &rt) {
    std::vector<jsi::Value> convertedArgs = expo::convertNSArrayToStdVector(rt, arguments);
    auto func = worklet->toJSValue(rt).asObject(rt).asFunction(rt);
    func.call(rt, (const jsi::Value *)convertedArgs.data(), convertedArgs.size());
  });
}

- (void)execute:(nonnull EXJavaScriptSerializable *)serializable
        runtime:(nonnull EXWorkletRuntime *)runtime
      arguments:(nonnull NSArray *)arguments
{
  auto workletRuntime = lockWorkletRuntime(runtime);
  auto worklet = extractWorklet(serializable);
  if (!workletRuntime || !worklet) {
    return;
  }
  workletRuntime->executeSync([worklet, arguments](jsi::Runtime &rt) -> jsi::Value {
    std::vector<jsi::Value> convertedArgs = expo::convertNSArrayToStdVector(rt, arguments);
    auto func = worklet->toJSValue(rt).asObject(rt).asFunction(rt);
    func.call(rt, (const jsi::Value *)convertedArgs.data(), convertedArgs.size());
    return jsi::Value::undefined();
  });
}

@end
