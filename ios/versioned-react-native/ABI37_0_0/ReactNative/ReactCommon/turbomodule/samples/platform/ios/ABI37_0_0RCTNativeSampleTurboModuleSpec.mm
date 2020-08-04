/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTNativeSampleTurboModuleSpec.h"

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

static ABI37_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_voidFunc(
    ABI37_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI37_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, VoidKind, "voidFunc", @selector(voidFunc), args, count);
}

static ABI37_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getBool(
    ABI37_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI37_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, BooleanKind, "getBool", @selector(getBool:), args, count);
}

static ABI37_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getNumber(
    ABI37_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI37_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, NumberKind, "getNumber", @selector(getNumber:), args, count);
}

static ABI37_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getString(
    ABI37_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI37_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, StringKind, "getString", @selector(getString:), args, count);
}

static ABI37_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getArray(
    ABI37_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI37_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ArrayKind, "getArray", @selector(getArray:), args, count);
}

static ABI37_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getObject(
    ABI37_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI37_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ObjectKind, "getObject", @selector(getObject:), args, count);
}

static ABI37_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getValue(
    ABI37_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI37_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ObjectKind, "getValue", @selector(getValue:y:z:), args, count);
}

static ABI37_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithCallback(
    ABI37_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI37_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, VoidKind, "getValueWithCallback", @selector(getValueWithCallback:), args, count);
}

static ABI37_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithPromise(
    ABI37_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI37_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(
          rt, PromiseKind, "getValueWithPromise", @selector(getValueWithPromise:resolve:reject:), args, count);
}

static ABI37_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getConstants(
    ABI37_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI37_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ObjectKind, "getConstants", @selector(getConstants), args, count);
}

NativeSampleTurboModuleSpecJSI::NativeSampleTurboModuleSpecJSI(
    id<ABI37_0_0RCTTurboModule> instance,
    std::shared_ptr<JSCallInvoker> jsInvoker)
    : ObjCTurboModule("SampleTurboModule", instance, jsInvoker)
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

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
