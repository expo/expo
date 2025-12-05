#pragma once

#include "JNIDeallocator.h"
#include "JSIContext.h"

#include <fbjni/ByteBuffer.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <memory>

namespace expo {

class JavaScriptRuntime;

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

/**
 * Represents JNI direct ByteBuffer instance, that can be passed
 * to JSI and then managed by JS.
 */
class ByteBufferJSIWrapper: public jsi::MutableBuffer {
public:
  explicit ByteBufferJSIWrapper(const jni::alias_ref<jni::JByteBuffer>& byteBuffer);

  ~ByteBufferJSIWrapper() override;

  [[nodiscard]] uint8_t* data() override;

  [[nodiscard]] size_t size() const override;

  [[nodiscard]] const jni::global_ref<jni::JByteBuffer>& getBuffer() const;

private:
  jni::global_ref<jni::JByteBuffer> _byteBuffer;
};

class NativeArrayBuffer : public jni::HybridClass<NativeArrayBuffer, Destructible> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/NativeArrayBuffer;";
  static auto constexpr TAG = "NativeArrayBuffer";

  static void registerNatives();

  static jni::local_ref<NativeArrayBuffer::jhybriddata> initHybrid(
    jni::alias_ref<jhybridobject>,
    jni::alias_ref<jni::JByteBuffer> byteBuffer
  );

  static jni::local_ref<NativeArrayBuffer::javaobject> newInstance(
    JSIContext *jsiContext,
    jsi::Runtime& runtime,
    jsi::ArrayBuffer& arrayBuffer
  );

  explicit NativeArrayBuffer(const jni::alias_ref<jni::JByteBuffer>& byteBuffer);

  [[nodiscard]] int size();

  [[nodiscard]] std::shared_ptr<ByteBufferJSIWrapper> jsiMutableBuffer();

  [[nodiscard]] jni::local_ref<jni::JByteBuffer> toDirectBuffer();

  template<class T>
  T read(int position) {
    return *reinterpret_cast<T *>(buffer->data() + position);
  }

private:
  std::shared_ptr<ByteBufferJSIWrapper> buffer;
};

} // namespace expo
