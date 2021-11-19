/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// NOTE: This entire file should be codegen'ed.

#include <ABI43_0_0ReactCommon/ABI43_0_0SampleTurboModuleSpec.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

static ABI43_0_0facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_voidFunc(
    ABI43_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI43_0_0facebook::jsi::Value *args,
    size_t count) {
  return static_cast<JavaTurboModule &>(turboModule)
      .invokeJavaMethod(rt, VoidKind, "voidFunc", "()V", args, count);
}

static ABI43_0_0facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getBool(
    ABI43_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI43_0_0facebook::jsi::Value *args,
    size_t count) {
  return static_cast<JavaTurboModule &>(turboModule)
      .invokeJavaMethod(rt, BooleanKind, "getBool", "(Z)Z", args, count);
}

static ABI43_0_0facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getNumber(
    ABI43_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI43_0_0facebook::jsi::Value *args,
    size_t count) {
  return static_cast<JavaTurboModule &>(turboModule)
      .invokeJavaMethod(rt, NumberKind, "getNumber", "(D)D", args, count);
}

static ABI43_0_0facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getString(
    ABI43_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI43_0_0facebook::jsi::Value *args,
    size_t count) {
  return static_cast<JavaTurboModule &>(turboModule)
      .invokeJavaMethod(
          rt,
          StringKind,
          "getString",
          "(Ljava/lang/String;)Ljava/lang/String;",
          args,
          count);
}

static ABI43_0_0facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getArray(
    ABI43_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI43_0_0facebook::jsi::Value *args,
    size_t count) {
  return static_cast<JavaTurboModule &>(turboModule)
      .invokeJavaMethod(
          rt,
          ArrayKind,
          "getArray",
          "(Lcom/facebook/ABI43_0_0React/bridge/ReadableArray;)Lcom/facebook/ABI43_0_0React/bridge/WritableArray;",
          args,
          count);
}

static ABI43_0_0facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getObject(
    ABI43_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI43_0_0facebook::jsi::Value *args,
    size_t count) {
  return static_cast<JavaTurboModule &>(turboModule)
      .invokeJavaMethod(
          rt,
          ObjectKind,
          "getObject",
          "(Lcom/facebook/ABI43_0_0React/bridge/ReadableMap;)Lcom/facebook/ABI43_0_0React/bridge/WritableMap;",
          args,
          count);
}

static ABI43_0_0facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getRootTag(
    ABI43_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI43_0_0facebook::jsi::Value *args,
    size_t count) {
  return static_cast<JavaTurboModule &>(turboModule)
      .invokeJavaMethod(rt, NumberKind, "getRootTag", "(D)D", args, count);
}

static ABI43_0_0facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getValue(
    ABI43_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI43_0_0facebook::jsi::Value *args,
    size_t count) {
  return static_cast<JavaTurboModule &>(turboModule)
      .invokeJavaMethod(
          rt,
          ObjectKind,
          "getValue",
          "(DLjava/lang/String;Lcom/facebook/ABI43_0_0React/bridge/ReadableMap;)Lcom/facebook/ABI43_0_0React/bridge/WritableMap;",
          args,
          count);
}

static ABI43_0_0facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithCallback(
    ABI43_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI43_0_0facebook::jsi::Value *args,
    size_t count) {
  return static_cast<JavaTurboModule &>(turboModule)
      .invokeJavaMethod(
          rt,
          VoidKind,
          "getValueWithCallback",
          "(Lcom/facebook/ABI43_0_0React/bridge/Callback;)V",
          args,
          count);
}

static ABI43_0_0facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithPromise(
    ABI43_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI43_0_0facebook::jsi::Value *args,
    size_t count) {
  return static_cast<JavaTurboModule &>(turboModule)
      .invokeJavaMethod(
          rt,
          PromiseKind,
          "getValueWithPromise",
          "(ZLcom/facebook/ABI43_0_0React/bridge/Promise;)V",
          args,
          count);
}

static ABI43_0_0facebook::jsi::Value
__hostFunction_NativeSampleTurboModuleSpecJSI_getConstants(
    ABI43_0_0facebook::jsi::Runtime &rt,
    TurboModule &turboModule,
    const ABI43_0_0facebook::jsi::Value *args,
    size_t count) {
  return static_cast<JavaTurboModule &>(turboModule)
      .invokeJavaMethod(
          rt, ObjectKind, "getConstants", "()Ljava/util/Map;", args, count);
}

NativeSampleTurboModuleSpecJSI::NativeSampleTurboModuleSpecJSI(
    const JavaTurboModule::InitParams &params)
    : JavaTurboModule(params) {
  methodMap_["voidFunc"] =
      MethodMetadata{0, __hostFunction_NativeSampleTurboModuleSpecJSI_voidFunc};

  methodMap_["getBool"] =
      MethodMetadata{1, __hostFunction_NativeSampleTurboModuleSpecJSI_getBool};

  methodMap_["getNumber"] = MethodMetadata{
      1, __hostFunction_NativeSampleTurboModuleSpecJSI_getNumber};

  methodMap_["getString"] = MethodMetadata{
      1, __hostFunction_NativeSampleTurboModuleSpecJSI_getString};

  methodMap_["getArray"] =
      MethodMetadata{1, __hostFunction_NativeSampleTurboModuleSpecJSI_getArray};

  methodMap_["getObject"] = MethodMetadata{
      1, __hostFunction_NativeSampleTurboModuleSpecJSI_getObject};

  methodMap_["getRootTag"] = MethodMetadata{
      1, __hostFunction_NativeSampleTurboModuleSpecJSI_getRootTag};

  methodMap_["getValue"] =
      MethodMetadata{3, __hostFunction_NativeSampleTurboModuleSpecJSI_getValue};

  methodMap_["getValueWithCallback"] = MethodMetadata{
      1, __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithCallback};

  methodMap_["getValueWithPromise"] = MethodMetadata{
      1, __hostFunction_NativeSampleTurboModuleSpecJSI_getValueWithPromise};

  methodMap_["getConstants"] = MethodMetadata{
      0, __hostFunction_NativeSampleTurboModuleSpecJSI_getConstants};
}

std::shared_ptr<TurboModule> SampleTurboModuleSpec_ModuleProvider(
    const std::string moduleName,
    const JavaTurboModule::InitParams &params) {
  if (moduleName == "SampleTurboModule") {
    return std::make_shared<NativeSampleTurboModuleSpecJSI>(params);
  }
  return nullptr;
}

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
