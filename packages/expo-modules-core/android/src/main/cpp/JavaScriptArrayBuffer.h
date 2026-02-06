#pragma once

#include "JNIDeallocator.h"
#include "JavaScriptRuntime.h"

#include <fbjni/ByteBuffer.h>
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

  [[nodiscard]] int size();

  [[nodiscard]] uint8_t* data();

  [[nodiscard]] jni::local_ref<jni::JByteBuffer> toDirectBuffer();

  [[nodiscard]] std::shared_ptr<jsi::ArrayBuffer> jsiArrayBuffer();

  template<class T>
  T read(int position) {
    return *reinterpret_cast<T *>(this->data() + position);
  }

private:
  std::weak_ptr<JavaScriptRuntime> runtimeHolder;
  std::shared_ptr<jsi::ArrayBuffer> arrayBuffer;
};
} // namespace expo
