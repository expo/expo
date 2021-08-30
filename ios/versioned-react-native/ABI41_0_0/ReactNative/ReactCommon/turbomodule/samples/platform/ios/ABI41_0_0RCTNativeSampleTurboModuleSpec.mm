/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTNativeSampleTurboModuleSpec.h"

namespace ABI41_0_0facebook {
namespace ABI41_0_0React {

static ABI41_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_voidFunc(
    ABI41_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI41_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, VoidKind, "voidFunc", @selector(voidFunc), args, count);
}

static ABI41_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getBool(
    ABI41_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI41_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, BooleanKind, "getBool", @selector(getBool:), args, count);
}

static ABI41_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getNumber(
    ABI41_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI41_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, NumberKind, "getNumber", @selector(getNumber:), args, count);
}

static ABI41_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getString(
    ABI41_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI41_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, StringKind, "getString", @selector(getString:), args, count);
}

static ABI41_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getArray(
    ABI41_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI41_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ArrayKind, "getArray", @selector(getArray:), args, count);
}

static ABI41_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getObject(
    ABI41_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI41_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ObjectKind, "getObject", @selector(getObject:), args, count);
}

static ABI41_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getValue(
    ABI41_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI41_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ObjectKind, "getValue", @selector(getValue:y:z:), args, count);
}

static ABI41_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithCallback(
    ABI41_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI41_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, VoidKind, "getValueWithCallback", @selector(getValueWithCallback:), args, count);
}

static ABI41_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithPromise(
    ABI41_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI41_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(
          rt, PromiseKind, "getValueWithPromise", @selector(getValueWithPromise:resolve:reject:), args, count);
}

static ABI41_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getConstants(
    ABI41_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI41_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ObjectKind, "getConstants", @selector(getConstants), args, count);
}

NativeSampleTurboModuleSpecJSI::NativeSampleTurboModuleSpecJSI(
    id<ABI41_0_0RCTTurboModule> instance,
    std::shared_ptr<CallInvoker> jsInvoker,
    std::shared_ptr<CallInvoker> nativeInvoker,
    id<ABI41_0_0RCTTurboModulePerformanceLogger> perfLogger)
    : ObjCTurboModule("SampleTurboModule", instance, jsInvoker, nativeInvoker, perfLogger)
{
  methodMap_["voidFunc"] = MethodMetadata{0, __hostFunction_NativeSampleTurboModuleSpecJSI_voidFunc};
  methodMap_["getBool"] = MethodMetadata{1, __hostFunction_NativeSampleTurboModuleSpecJSI_getBool};
  methodMap_["getNumber"] = MethodMetadata{1, __hostFunction_NativeSampleTurboModuleSpecJSI_getNumber};
  methodMap_["getString"] = MethodMetadata{1, __hostFunction_NativeSampleTurboModuleSpecJSI_getString};
  methodMap_["getArray"] = MethodMetadata{1, __hostFunction_NativeSampleTurboModuleSpecJSI_getArray};
  methodMap_["getObject"] = MethodMetadata{1, __hostFunction_NativeSampleTurboModuleSpecJSI_getObject};
  methodMap_["getValue"] = MethodMetadata{3, __hostFunction_NativeSampleTurboModuleSpecJSI_getValue};
  methodMap_["getValueWithCallback"] =
      MethodMetadata{1, __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithCallback};
  methodMap_["getValueWithPromise"] =
      MethodMetadata{1, __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithPromise};
  methodMap_["getConstants"] = MethodMetadata{0, __hostFunction_NativeSampleTurboModuleSpecJSI_getConstants};
}

} // namespace ABI41_0_0React
} // namespace ABI41_0_0facebook
