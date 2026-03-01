#pragma once

#if WORKLETS_ENABLED

#include "../JSIContext.h"
#include "../JNIDeallocator.h"
#include "WorkletNativeRuntime.h"
#include "Serializable.h"

#include <fbjni/fbjni.h>
#include <worklets/SharedItems/Serializable.h>

namespace jni = facebook::jni;

namespace expo {

class Worklet : public jni::JavaClass<Worklet> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/worklets/Worklet;";
  static auto constexpr TAG = "Worklet";

  static void registerNatives();

  static void schedule(
    jni::alias_ref<Worklet::javaobject> self,
    jni::alias_ref<WorkletNativeRuntime::javaobject> workletRuntimeHolder,
    jni::alias_ref<Serializable::javaobject> synchronizable
  );

  static void execute(
    jni::alias_ref<Worklet::javaobject> self,
    jni::alias_ref<WorkletNativeRuntime::javaobject> workletRuntimeHolder,
    jni::alias_ref<Serializable::javaobject> synchronizable
  );

  static void scheduleWithArgs(
    jni::alias_ref<Worklet::javaobject> self,
    jni::alias_ref<WorkletNativeRuntime::javaobject> workletRuntimeHolder,
    jni::alias_ref<Serializable::javaobject> synchronizable,
    jni::alias_ref<jni::JArrayClass<jobject>> args
  );

  static void executeWithArgs(
    jni::alias_ref<Worklet::javaobject> self,
    jni::alias_ref<WorkletNativeRuntime::javaobject> workletRuntimeHolder,
    jni::alias_ref<Serializable::javaobject> synchronizable,
    jni::alias_ref<jni::JArrayClass<jobject>> args
  );
};

} // namespace expo

#endif
