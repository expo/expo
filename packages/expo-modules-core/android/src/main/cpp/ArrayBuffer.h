#pragma once

#include "ExpoHeader.pch"
#include "JNIDeallocator.h"
#include "JSIContext.h"
#include "TypedArray.h"

#include <fbjni/ByteBuffer.h>

namespace expo {

class JavaScriptRuntime;

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

class ArrayBufferByteBufferWrapper: public jsi::MutableBuffer {
public:
  explicit ArrayBufferByteBufferWrapper(const jni::alias_ref<jni::JByteBuffer>& byteBuffer);

  ArrayBufferByteBufferWrapper(
    const jni::alias_ref<jni::JByteBuffer>& byteBuffer,
    std::shared_ptr<jsi::MutableBuffer> retainedBuffer
  );

  ~ArrayBufferByteBufferWrapper() override;

  [[nodiscard]] uint8_t* data() override;

  [[nodiscard]] size_t size() const override;

  [[nodiscard]] const jni::global_ref<jni::JByteBuffer>& getBuffer() const;

private:
  jni::global_ref<jni::JByteBuffer> _byteBuffer;
  std::shared_ptr<jsi::MutableBuffer> _retainedBuffer;
};

class ArrayBuffer : public jni::HybridClass<ArrayBuffer, Destructible> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/ArrayBuffer;";
  static auto constexpr TAG = "ArrayBuffer";

  static void registerNatives();

  static jni::local_ref<ArrayBuffer::jhybriddata> initHybrid(
    jni::alias_ref<jhybridobject>,
    jni::alias_ref<jni::JByteBuffer> byteBuffer
  );

  static jni::local_ref<ArrayBuffer::javaobject> newInstance(
    JSIContext *jsiContext,
    jsi::Runtime& runtime,
    jsi::ArrayBuffer& arrayBuffer
  );

  static jni::local_ref<ArrayBuffer::javaobject> newInstance(
    JSIContext *jsiContext,
    jsi::Runtime& runtime,
    expo::TypedArray& typedArray
  );

  explicit ArrayBuffer(const jni::alias_ref<jni::JByteBuffer>& byteBuffer);

  ArrayBuffer(
    const jni::alias_ref<jni::JByteBuffer>& byteBuffer,
    std::shared_ptr<jsi::MutableBuffer> retainedBuffer
  );

  [[nodiscard]] int size();

  [[nodiscard]] std::shared_ptr<ArrayBufferByteBufferWrapper> jsiMutableBuffer();

  [[nodiscard]] jni::local_ref<jni::JByteBuffer> toDirectBuffer();

  template<class T>
  T read(int position) {
    return *reinterpret_cast<T *>(buffer->data() + position);
  }

private:
  std::shared_ptr<ArrayBufferByteBufferWrapper> buffer;
};

} // namespace expo
