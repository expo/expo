/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTNativeSampleTurboModuleSpec.h"

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

static ABI49_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_voidFunc(
    ABI49_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI49_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, VoidKind, "voidFunc", @selector(voidFunc), args, count);
}

static ABI49_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getBool(
    ABI49_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI49_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, BooleanKind, "getBool", @selector(getBool:), args, count);
}

static ABI49_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getEnum(
    ABI49_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI49_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, NumberKind, "getEnum", @selector(getEnum:), args, count);
}

static ABI49_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getNumber(
    ABI49_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI49_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, NumberKind, "getNumber", @selector(getNumber:), args, count);
}

static ABI49_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getString(
    ABI49_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI49_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, StringKind, "getString", @selector(getString:), args, count);
}

static ABI49_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getArray(
    ABI49_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI49_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ArrayKind, "getArray", @selector(getArray:), args, count);
}

static ABI49_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getObject(
    ABI49_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI49_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ObjectKind, "getObject", @selector(getObject:), args, count);
}

static ABI49_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getUnsafeObject(
    ABI49_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI49_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ObjectKind, "getUnsafeObject", @selector(getUnsafeObject:), args, count);
}

static ABI49_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getRootTag(
    ABI49_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI49_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, NumberKind, "getRootTag", @selector(getRootTag:), args, count);
}

static ABI49_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getValue(
    ABI49_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI49_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ObjectKind, "getValue", @selector(getValue:y:z:), args, count);
}

static ABI49_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithCallback(
    ABI49_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI49_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, VoidKind, "getValueWithCallback", @selector(getValueWithCallback:), args, count);
}

static ABI49_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithPromise(
    ABI49_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI49_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(
          rt, PromiseKind, "getValueWithPromise", @selector(getValueWithPromise:resolve:reject:), args, count);
}

static ABI49_0_0facebook::jsi::Value __hostFunction_NativeSampleTurboModuleSpecJSI_getConstants(
    ABI49_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI49_0_0facebook::jsi::Value *args,
    size_t count)
{
  return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(rt, ObjectKind, "getConstants", @selector(getConstants), args, count);
}

NativeSampleTurboModuleSpecJSI::NativeSampleTurboModuleSpecJSI(const ObjCTurboModule::InitParams &params)
    : ObjCTurboModule(params)
{
  methodMap_["voidFunc"] = MethodMetadata{0, __hostFunction_NativeSampleTurboModuleSpecJSI_voidFunc};
  methodMap_["getBool"] = MethodMetadata{1, __hostFunction_NativeSampleTurboModuleSpecJSI_getBool};
  methodMap_["getEnum"] = MethodMetadata{1, __hostFunction_NativeSampleTurboModuleSpecJSI_getEnum};
  methodMap_["getNumber"] = MethodMetadata{1, __hostFunction_NativeSampleTurboModuleSpecJSI_getNumber};
  methodMap_["getString"] = MethodMetadata{1, __hostFunction_NativeSampleTurboModuleSpecJSI_getString};
  methodMap_["getArray"] = MethodMetadata{1, __hostFunction_NativeSampleTurboModuleSpecJSI_getArray};
  methodMap_["getObject"] = MethodMetadata{1, __hostFunction_NativeSampleTurboModuleSpecJSI_getObject};
  methodMap_["getUnsafeObject"] = MethodMetadata{1, __hostFunction_NativeSampleTurboModuleSpecJSI_getUnsafeObject};
  methodMap_["getRootTag"] = MethodMetadata{1, __hostFunction_NativeSampleTurboModuleSpecJSI_getRootTag};
  methodMap_["getValue"] = MethodMetadata{3, __hostFunction_NativeSampleTurboModuleSpecJSI_getValue};
  methodMap_["getValueWithCallback"] =
      MethodMetadata{1, __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithCallback};
  methodMap_["getValueWithPromise"] =
      MethodMetadata{1, __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithPromise};
  methodMap_["getConstants"] = MethodMetadata{0, __hostFunction_NativeSampleTurboModuleSpecJSI_getConstants};
}

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
