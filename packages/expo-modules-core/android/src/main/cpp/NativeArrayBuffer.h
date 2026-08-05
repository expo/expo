#pragma once

#include "ExpoHeader.pch"
#include "JNIDeallocator.h"
#include "JSIContext.h"

#include <fbjni/ByteBuffer.h>

#include "TypedArray.h"

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

  ByteBufferJSIWrapper(
    const jni::alias_ref<jni::JByteBuffer>& byteBuffer,
    std::shared_ptr<jsi::MutableBuffer> retainedBuffer
  );

  ~ByteBufferJSIWrapper() override;

  [[nodiscard]] uint8_t* data() override;

  [[nodiscard]] size_t size() const override;

  [[nodiscard]] const jni::global_ref<jni::JByteBuffer>& getBuffer() const;

private:
  jni::global_ref<jni::JByteBuffer> _byteBuffer;
  std::shared_ptr<jsi::MutableBuffer> _retainedBuffer;
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

  /**
   * Creates a NativeArrayBuffer from the given ArrayBuffer. Uses zero-copy when the
   * buffer is native-backed (tryGetMutableBuffer), otherwise copies the data.
   */
  static jni::local_ref<NativeArrayBuffer::javaobject> newInstance(
    JSIContext *jsiContext,
    jsi::Runtime& runtime,
    jsi::ArrayBuffer& arrayBuffer
  );

  /**
   * Creates a NativeArrayBuffer from the typed array's view range. Uses zero-copy
   * when the backing buffer is native-backed, otherwise copies only the viewed bytes.
   */
  static jni::local_ref<NativeArrayBuffer::javaobject> newInstance(
    JSIContext *jsiContext,
    jsi::Runtime& runtime,
    expo::TypedArray& typedArray
  );

  explicit NativeArrayBuffer(const jni::alias_ref<jni::JByteBuffer>& byteBuffer);

  NativeArrayBuffer(
    const jni::alias_ref<jni::JByteBuffer>& byteBuffer,
    std::shared_ptr<jsi::MutableBuffer> retainedBuffer
  );

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
