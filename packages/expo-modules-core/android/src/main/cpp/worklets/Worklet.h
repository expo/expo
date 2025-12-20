#pragma once

#if WORKLETS_ENABLED

#include "../JSIContext.h"
#include "../JNIDeallocator.h"
#include "WorkletRuntimeHolder.h"

#include <fbjni/fbjni.h>
#include <worklets/SharedItems/Serializable.h>

namespace jni = facebook::jni;

namespace expo {

class Worklet : public jni::HybridClass<Worklet, Destructible> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/worklets/Worklet;";
  static auto constexpr TAG = "Worklet";

  static void registerNatives();

  static jni::local_ref<Worklet::javaobject> newInstance(
    JSIContext *jsiContext,
    const std::shared_ptr<worklets::SerializableWorklet> &worklet
  );

  explicit Worklet(
    const std::shared_ptr<worklets::SerializableWorklet> &worklet
  );

  void schedule(
    jni::alias_ref<WorkletRuntimeHolder::javaobject> workletRuntimeHolder
  );

  void execute(
    jni::alias_ref<WorkletRuntimeHolder::javaobject> workletRuntimeHolder
  );
private:
  friend HybridBase;

  std::shared_ptr<worklets::SerializableWorklet> worklet_;
};

} // namespace expo

#endif
