#include "Worklet.h"

#if WORKLETS_ENABLED

#include "../types/JNIToJSIConverter.h"

namespace expo {

void Worklet::registerNatives() {
  javaClassLocal()->registerNatives({
                                      makeNativeMethod("schedule", Worklet::schedule),
                                      makeNativeMethod("schedule", Worklet::scheduleWithArgs),
                                      makeNativeMethod("execute", Worklet::execute),
                                      makeNativeMethod("execute", Worklet::executeWithArgs),
                                    });
}

void Worklet::schedule(
  jni::alias_ref<Worklet::javaobject> self,
  jni::alias_ref<WorkletNativeRuntime::javaobject> workletRuntimeHolder,
  jni::alias_ref<Serializable::javaobject> synchronizable
) {
  auto workletRuntime = workletRuntimeHolder->cthis()->workletRuntime.lock();
  auto worklet = std::dynamic_pointer_cast<worklets::SerializableWorklet>(
    synchronizable->cthis()->getSerializable()
  );

  workletRuntime->schedule(std::move(worklet));
}

void Worklet::execute(
  jni::alias_ref<Worklet::javaobject> self,
  jni::alias_ref<WorkletNativeRuntime::javaobject> workletRuntimeHolder,
  jni::alias_ref<Serializable::javaobject> synchronizable
) {
  auto workletRuntime = workletRuntimeHolder->cthis()->workletRuntime.lock();
  auto worklet = std::dynamic_pointer_cast<worklets::SerializableWorklet>(
    synchronizable->cthis()->getSerializable()
  );

  workletRuntime->runSync(worklet);
}

void Worklet::scheduleWithArgs(
  jni::alias_ref<Worklet::javaobject> self,
  jni::alias_ref<WorkletNativeRuntime::javaobject> workletRuntimeHolder,
  jni::alias_ref<Serializable::javaobject> synchronizable,
  jni::alias_ref<jni::JArrayClass<jobject>> args
) {
  auto workletRuntime = workletRuntimeHolder->cthis()->workletRuntime.lock();
  auto worklet = std::dynamic_pointer_cast<worklets::SerializableWorklet>(
    synchronizable->cthis()->getSerializable()
  );

  workletRuntime->schedule([&worklet, globalArgs = jni::make_global(args)](jsi::Runtime &rt) mutable {
    JNIEnv *env = jni::Environment::current();
    std::vector<jsi::Value> convertedArgs = convertArray(env, rt, globalArgs);

    auto func = worklet->toJSValue(rt).asObject(rt).asFunction(rt);
    func.call(
      rt,
      (const jsi::Value *) convertedArgs.data(),
      convertedArgs.size()
    );
  });
}

void Worklet::executeWithArgs(
  jni::alias_ref<Worklet::javaobject> self,
  jni::alias_ref<WorkletNativeRuntime::javaobject> workletRuntimeHolder,
  jni::alias_ref<Serializable::javaobject> synchronizable,
  jni::alias_ref<jni::JArrayClass<jobject>> args
) {
  auto workletRuntime = workletRuntimeHolder->cthis()->workletRuntime.lock();
  auto worklet = std::dynamic_pointer_cast<worklets::SerializableWorklet>(
    synchronizable->cthis()->getSerializable()
  );

  workletRuntime->runSync([&args, &worklet](jsi::Runtime &rt) {
    JNIEnv *env = jni::Environment::current();
    std::vector<jsi::Value> convertedArgs = convertArray(env, rt, args);

    auto func = worklet->toJSValue(rt).asObject(rt).asFunction(rt);
    func.call(
      rt,
      (const jsi::Value *) convertedArgs.data(),
      convertedArgs.size()
    );
  });
}

} // namespace expo

#endif
