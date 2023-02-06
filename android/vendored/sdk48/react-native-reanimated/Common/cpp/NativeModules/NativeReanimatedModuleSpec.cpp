#include "NativeReanimatedModuleSpec.h"

#include <utility>

#define SPEC_PREFIX(FN_NAME) __hostFunction_NativeReanimatedModuleSpec_##FN_NAME

namespace reanimated {

static jsi::Value SPEC_PREFIX(installCoreFunctions)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->installCoreFunctions(rt, std::move(args[0]));
  return jsi::Value::undefined();
}

// SharedValue

static jsi::Value SPEC_PREFIX(makeShareable)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->makeShareable(rt, std::move(args[0]));
}

static jsi::Value SPEC_PREFIX(makeMutable)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->makeMutable(rt, std::move(args[0]));
}

static jsi::Value SPEC_PREFIX(makeRemote)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->makeRemote(rt, std::move(args[0]));
}

static jsi::Value SPEC_PREFIX(startMapper)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->startMapper(
          rt,
          std::move(args[0]),
          std::move(args[1]),
          std::move(args[2]),
          std::move(args[3]),
          std::move(args[4]));
}

static jsi::Value SPEC_PREFIX(stopMapper)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->stopMapper(rt, std::move(args[0]));
  return jsi::Value::undefined();
}

static jsi::Value SPEC_PREFIX(registerEventHandler)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->registerEventHandler(rt, std::move(args[0]), std::move(args[1]));
}

static jsi::Value SPEC_PREFIX(unregisterEventHandler)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->unregisterEventHandler(rt, std::move(args[0]));
  return jsi::Value::undefined();
}

static jsi::Value SPEC_PREFIX(getViewProp)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->getViewProp(
          rt, std::move(args[0]), std::move(args[1]), std::move(args[2]));
  return jsi::Value::undefined();
}

static jsi::Value SPEC_PREFIX(enableLayoutAnimations)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->enableLayoutAnimations(rt, std::move(args[0]));
  return jsi::Value::undefined();
}

static jsi::Value SPEC_PREFIX(registerSensor)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->registerSensor(
          rt, std::move(args[0]), std::move(args[1]), std::move(args[2]));
}

static jsi::Value SPEC_PREFIX(unregisterSensor)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->unregisterSensor(rt, std::move(args[0]));
  return jsi::Value::undefined();
}

static jsi::Value SPEC_PREFIX(configureProps)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->configureProps(rt, std::move(args[0]), std::move(args[1]));
  return jsi::Value::undefined();
}

static jsi::Value SPEC_PREFIX(subscribeForKeyboardEvents)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->subscribeForKeyboardEvents(rt, std::move(args[0]));
}

static jsi::Value SPEC_PREFIX(unsubscribeFromKeyboardEvents)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->unsubscribeFromKeyboardEvents(rt, std::move(args[0]));
  return jsi::Value::undefined();
}

NativeReanimatedModuleSpec::NativeReanimatedModuleSpec(
    std::shared_ptr<CallInvoker> jsInvoker)
    : TurboModule("NativeReanimated", jsInvoker) {
  methodMap_["installCoreFunctions"] =
      MethodMetadata{1, SPEC_PREFIX(installCoreFunctions)};

  methodMap_["makeShareable"] = MethodMetadata{1, SPEC_PREFIX(makeShareable)};
  methodMap_["makeMutable"] = MethodMetadata{1, SPEC_PREFIX(makeMutable)};
  methodMap_["makeRemote"] = MethodMetadata{1, SPEC_PREFIX(makeRemote)};

  methodMap_["startMapper"] = MethodMetadata{5, SPEC_PREFIX(startMapper)};
  methodMap_["stopMapper"] = MethodMetadata{1, SPEC_PREFIX(stopMapper)};

  methodMap_["registerEventHandler"] =
      MethodMetadata{2, SPEC_PREFIX(registerEventHandler)};
  methodMap_["unregisterEventHandler"] =
      MethodMetadata{1, SPEC_PREFIX(unregisterEventHandler)};

  methodMap_["getViewProp"] = MethodMetadata{3, SPEC_PREFIX(getViewProp)};
  methodMap_["enableLayoutAnimations"] =
      MethodMetadata{2, SPEC_PREFIX(enableLayoutAnimations)};
  methodMap_["registerSensor"] = MethodMetadata{3, SPEC_PREFIX(registerSensor)};
  methodMap_["unregisterSensor"] =
      MethodMetadata{1, SPEC_PREFIX(unregisterSensor)};
  methodMap_["configureProps"] = MethodMetadata{2, SPEC_PREFIX(configureProps)};
  methodMap_["subscribeForKeyboardEvents"] =
      MethodMetadata{1, SPEC_PREFIX(subscribeForKeyboardEvents)};
  methodMap_["unsubscribeFromKeyboardEvents"] =
      MethodMetadata{1, SPEC_PREFIX(unsubscribeFromKeyboardEvents)};
}
} // namespace reanimated
