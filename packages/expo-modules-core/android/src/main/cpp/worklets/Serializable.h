#pragma once

#if WORKLETS_ENABLED

#include "../JSIContext.h"
#include "../JNIDeallocator.h"
#include "WorkletNativeRuntime.h"

#include <fbjni/fbjni.h>
#include <worklets/SharedItems/Serializable.h>

namespace jni = facebook::jni;

namespace expo {

class Serializable : public jni::HybridClass<Serializable, Destructible> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/worklets/Serializable;";
  static auto constexpr TAG = "Serializable";

  static jni::local_ref<Serializable::javaobject> newInstance(
    JSIContext *jsiContext,
    const std::shared_ptr<worklets::Serializable> &serializable
  );

  explicit Serializable(
    const std::shared_ptr<worklets::Serializable> &serializable
  );

  std::shared_ptr<worklets::Serializable> getSerializable();

private:
  friend HybridBase;

  static jni::local_ref<Serializable::javaobject> newJavaInstance(
    jni::local_ref<jni::detail::HybridData> hybridData,
    worklets::Serializable::ValueType valueType
  );

  std::shared_ptr<worklets::Serializable> serializable_;
};

} // namespace expo

#endif
