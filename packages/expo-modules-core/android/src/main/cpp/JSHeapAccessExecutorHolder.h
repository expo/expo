#pragma once

#include "ExpoHeader.pch"

namespace expo {

namespace jni = facebook::jni;

class JSHeapAccessExecutorJavaClass : public jni::JavaClass<JSHeapAccessExecutorJavaClass> {
public:
  static auto constexpr kJavaDescriptor = "Lexpo/modules/kotlin/jni/JSHeapAccessExecutor;";
};

class JSHeapAccessExecutorHolder {
public:
  explicit JSHeapAccessExecutorHolder(jni::alias_ref<jni::JObject> executor);

  ~JSHeapAccessExecutorHolder();

  void runSync(std::function<void()> &&body);

  bool runAsync(std::function<void()> &&body);

private:
  jni::global_ref<jni::JObject> _executor;
};

} // namespace expo
