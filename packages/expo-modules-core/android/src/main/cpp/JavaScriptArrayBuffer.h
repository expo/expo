#pragma once

#include "WeakRuntimeHolder.h"
#include "JNIDeallocator.h"

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <memory>

namespace expo {

class JavaScriptRuntime;

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

class JavaScriptArrayBuffer : public jni::HybridClass<JavaScriptArrayBuffer, Destructible> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/JavaScriptArrayBuffer;";
  static auto constexpr TAG = "JavaScriptArrayBuffer";

  static void registerNatives();

  static jni::local_ref<JavaScriptArrayBuffer::javaobject> newInstance(
    JSIContext *jSIContext,
    std::weak_ptr<JavaScriptRuntime> runtime,
    std::shared_ptr<jsi::ArrayBuffer> arrayBuffer
  );

  JavaScriptArrayBuffer(
    std::weak_ptr<JavaScriptRuntime> runtime,
    std::shared_ptr<jsi::ArrayBuffer> arrayBuffer
  );

  JavaScriptArrayBuffer(
    WeakRuntimeHolder runtime,
    std::shared_ptr<jsi::ArrayBuffer> arrayBuffer
  );

  int size();

  template<class T>
  T read(int position) {
    jsi::Runtime &jsRuntime = runtimeHolder.getJSRuntime();
    return *reinterpret_cast<T *>(arrayBuffer->data(jsRuntime) + position);
  }

private:
  WeakRuntimeHolder runtimeHolder;
  std::shared_ptr<jsi::ArrayBuffer> arrayBuffer;
};
} // namespace expo
