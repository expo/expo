#include "NativeReanimatedModuleSpec.h"

namespace reanimated {

static jsi::Value __hostFunction_NativeReanimatedModuleSpec_installCoreFunctions(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
    ->installCoreFunctions(rt, std::move(args[0]));
  return jsi::Value::undefined();
}

// SharedValue

static jsi::Value __hostFunction_NativeReanimatedModuleSpec_makeShareable(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
    ->makeShareable(rt, std::move(args[0]));
}

static jsi::Value __hostFunction_NativeReanimatedModuleSpec_makeMutable(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
    ->makeMutable(rt, std::move(args[0]));
}

static jsi::Value __hostFunction_NativeReanimatedModuleSpec_makeRemote(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
    ->makeRemote(rt, std::move(args[0]));
}

static jsi::Value __hostFunction_NativeReanimatedModuleSpec_startMapper(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->startMapper(rt, std::move(args[0]), std::move(args[1]), std::move(args[2]));
}

static jsi::Value __hostFunction_NativeReanimatedModuleSpec_stopMapper(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->stopMapper(rt, std::move(args[0]));
  return jsi::Value::undefined();
}

static jsi::Value __hostFunction_NativeReanimatedModuleSpec_registerEventHandler(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  return static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->registerEventHandler(rt, std::move(args[0]), std::move(args[1]));
}

static jsi::Value __hostFunction_NativeReanimatedModuleSpec_unregisterEventHandler(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
      ->unregisterEventHandler(rt, std::move(args[0]));
  return jsi::Value::undefined();
}

static jsi::Value __hostFunction_NativeReanimatedModuleSpec_getViewProp(
    jsi::Runtime &rt,
    TurboModule &turboModule,
    const jsi::Value *args,
    size_t count) {
  static_cast<NativeReanimatedModuleSpec *>(&turboModule)
        ->getViewProp(rt, std::move(args[0]), std::move(args[1]), std::move(args[2]));
    return jsi::Value::undefined();
}

NativeReanimatedModuleSpec::NativeReanimatedModuleSpec(std::shared_ptr<CallInvoker> jsInvoker)
    : TurboModule("NativeReanimated", jsInvoker) {
  methodMap_["installCoreFunctions"] = MethodMetadata{
    1, __hostFunction_NativeReanimatedModuleSpec_installCoreFunctions};


  methodMap_["makeShareable"] = MethodMetadata{
      1, __hostFunction_NativeReanimatedModuleSpec_makeShareable};
  methodMap_["makeMutable"] = MethodMetadata{
      1, __hostFunction_NativeReanimatedModuleSpec_makeMutable};
  methodMap_["makeRemote"] = MethodMetadata{
      1, __hostFunction_NativeReanimatedModuleSpec_makeRemote};
      

  methodMap_["startMapper"] = MethodMetadata{
    3, __hostFunction_NativeReanimatedModuleSpec_startMapper};
  methodMap_["stopMapper"] = MethodMetadata{
    1, __hostFunction_NativeReanimatedModuleSpec_stopMapper};

  methodMap_["registerEventHandler"] = MethodMetadata{
    2, __hostFunction_NativeReanimatedModuleSpec_registerEventHandler};
  methodMap_["unregisterEventHandler"] = MethodMetadata{
    1, __hostFunction_NativeReanimatedModuleSpec_unregisterEventHandler};

  methodMap_["getViewProp"] = MethodMetadata{
    3, __hostFunction_NativeReanimatedModuleSpec_getViewProp};
}

}

