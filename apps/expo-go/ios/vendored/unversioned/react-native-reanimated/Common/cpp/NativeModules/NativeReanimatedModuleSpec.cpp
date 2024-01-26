#include "NativeReanimatedModuleSpec.h"

#include <utility>

#define SPEC_PREFIX(FN_NAME) __hostFunction_NativeReanimatedModuleSpec_##FN_NAME

namespace reanimated {

static jsi::Value SPEC_PREFIX(installValueUnpacker)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->installValueUnpacker(rt, std::move(args[0]));
  return jsi::Value::undefined();
}

// SharedValue

static jsi::Value SPEC_PREFIX(makeShareableClone)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->makeShareableClone(rt, std::move(args[0]), std::move(args[1]));
}

// Sync methods

static jsi::Value SPEC_PREFIX(makeSynchronizedDataHolder)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->makeSynchronizedDataHolder(rt, std::move(args[0]));
}

static jsi::Value SPEC_PREFIX(getDataSynchronously)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->getDataSynchronously(rt, std::move(args[0]));
}

// scheduler

static jsi::Value SPEC_PREFIX(scheduleOnUI)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->scheduleOnUI(rt, std::move(args[0]));
  return jsi::Value::undefined();
}

static jsi::Value SPEC_PREFIX(createWorkletRuntime)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->createWorkletRuntime(rt, std::move(args[0]), std::move(args[1]));
}

static jsi::Value SPEC_PREFIX(scheduleOnRuntime)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->scheduleOnRuntime(rt, std::move(args[0]), std::move(args[1]));
}

static jsi::Value SPEC_PREFIX(registerEventHandler)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->registerEventHandler(
          rt, std::move(args[0]), std::move(args[1]), std::move(args[2]));
}

static jsi::Value SPEC_PREFIX(unregisterEventHandler)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->unregisterEventHandler(rt, std::move(args[0]));
  return jsi::Value::undefined();
}

static jsi::Value SPEC_PREFIX(getViewProp)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->getViewProp(
          rt, std::move(args[0]), std::move(args[1]), std::move(args[2]));
  return jsi::Value::undefined();
}

static jsi::Value SPEC_PREFIX(enableLayoutAnimations)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->enableLayoutAnimations(rt, std::move(args[0]));
  return jsi::Value::undefined();
}

static jsi::Value SPEC_PREFIX(registerSensor)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->registerSensor(
          rt,
          std::move(args[0]),
          std::move(args[1]),
          std::move(args[2]),
          std::move(args[3]));
}

static jsi::Value SPEC_PREFIX(unregisterSensor)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->unregisterSensor(rt, std::move(args[0]));
  return jsi::Value::undefined();
}

static jsi::Value SPEC_PREFIX(configureProps)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->configureProps(rt, std::move(args[0]), std::move(args[1]));
  return jsi::Value::undefined();
}

static jsi::Value SPEC_PREFIX(subscribeForKeyboardEvents)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->subscribeForKeyboardEvents(rt, std::move(args[0]), std::move(args[1]));
}

static jsi::Value SPEC_PREFIX(unsubscribeFromKeyboardEvents)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->unsubscribeFromKeyboardEvents(rt, std::move(args[0]));
  return jsi::Value::undefined();
}

static jsi::Value SPEC_PREFIX(configureLayoutAnimation)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->configureLayoutAnimation(
          rt,
          std::move(args[0]),
          std::move(args[1]),
          std::move(args[2]),
          std::move(args[3]));
}

static jsi::Value SPEC_PREFIX(setShouldAnimateExiting)(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->setShouldAnimateExiting(rt, std::move(args[0]), std::move(args[1]));
  return jsi::Value::undefined();
}

NativeReanimatedModuleSpec::NativeReanimatedModuleSpec(
    std::shared_ptr<CallInvoker> jsInvoker)
    : TurboModule("NativeReanimated", jsInvoker) {
  methodMap_["installValueUnpacker"] =
      MethodMetadata{1, SPEC_PREFIX(installValueUnpacker)};

  methodMap_["makeShareableClone"] =
      MethodMetadata{2, SPEC_PREFIX(makeShareableClone)};

  methodMap_["makeSynchronizedDataHolder"] =
      MethodMetadata{1, SPEC_PREFIX(makeSynchronizedDataHolder)};
  methodMap_["getDataSynchronously"] =
      MethodMetadata{1, SPEC_PREFIX(getDataSynchronously)};

  methodMap_["scheduleOnUI"] = MethodMetadata{1, SPEC_PREFIX(scheduleOnUI)};
  methodMap_["createWorkletRuntime"] =
      MethodMetadata{2, SPEC_PREFIX(createWorkletRuntime)};
  methodMap_["scheduleOnRuntime"] =
      MethodMetadata{2, SPEC_PREFIX(scheduleOnRuntime)};

  methodMap_["registerEventHandler"] =
      MethodMetadata{3, SPEC_PREFIX(registerEventHandler)};
  methodMap_["unregisterEventHandler"] =
      MethodMetadata{1, SPEC_PREFIX(unregisterEventHandler)};

  methodMap_["getViewProp"] = MethodMetadata{3, SPEC_PREFIX(getViewProp)};
  methodMap_["enableLayoutAnimations"] =
      MethodMetadata{2, SPEC_PREFIX(enableLayoutAnimations)};
  methodMap_["registerSensor"] = MethodMetadata{4, SPEC_PREFIX(registerSensor)};
  methodMap_["unregisterSensor"] =
      MethodMetadata{1, SPEC_PREFIX(unregisterSensor)};
  methodMap_["configureProps"] = MethodMetadata{2, SPEC_PREFIX(configureProps)};
  methodMap_["subscribeForKeyboardEvents"] =
      MethodMetadata{2, SPEC_PREFIX(subscribeForKeyboardEvents)};
  methodMap_["unsubscribeFromKeyboardEvents"] =
      MethodMetadata{1, SPEC_PREFIX(unsubscribeFromKeyboardEvents)};

  methodMap_["configureLayoutAnimation"] =
      MethodMetadata{4, SPEC_PREFIX(configureLayoutAnimation)};
  methodMap_["setShouldAnimateExitingForTag"] =
      MethodMetadata{2, SPEC_PREFIX(setShouldAnimateExiting)};
}
} // namespace reanimated
