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

class ArrayBufferStorage : public jsi::MutableBuffer {
public:
  ~ArrayBufferStorage() override = default;

  [[nodiscard]] virtual bool isNativeBacked() const noexcept = 0;

  [[nodiscard]] virtual jni::local_ref<jni::JByteBuffer> toDirectBuffer(bool copyBorrowed) = 0;
};

class ByteBufferArrayBufferStorage : public ArrayBufferStorage {
public:
  explicit ByteBufferArrayBufferStorage(const jni::alias_ref<jni::JByteBuffer> &byteBuffer);

  ~ByteBufferArrayBufferStorage() override;

  [[nodiscard]] uint8_t* data() override;

  [[nodiscard]] size_t size() const override;

  [[nodiscard]] bool isNativeBacked() const noexcept override;

  [[nodiscard]] jni::local_ref<jni::JByteBuffer> toDirectBuffer(bool copyBorrowed) override;

private:
  jni::global_ref<jni::JByteBuffer> _byteBuffer;
};

class MutableBufferViewArrayBufferStorage : public ArrayBufferStorage {
public:
  MutableBufferViewArrayBufferStorage(
    std::shared_ptr<jsi::MutableBuffer> backingBuffer,
    size_t offset,
    size_t length
  );

  [[nodiscard]] uint8_t* data() override;

  [[nodiscard]] size_t size() const override;

  [[nodiscard]] bool isNativeBacked() const noexcept override;

  [[nodiscard]] jni::local_ref<jni::JByteBuffer> toDirectBuffer(bool copyBorrowed) override;

private:
  std::shared_ptr<jsi::MutableBuffer> _backingBuffer;
  size_t _offset;
  size_t _length;
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
    jsi::Runtime &runtime,
    jsi::ArrayBuffer &arrayBuffer
  );

  static jni::local_ref<ArrayBuffer::javaobject> newInstance(
    JSIContext *jsiContext,
    jsi::Runtime &runtime,
    expo::TypedArray &typedArray
  );

  explicit ArrayBuffer(const jni::alias_ref<jni::JByteBuffer> &byteBuffer);

  explicit ArrayBuffer(std::shared_ptr<ArrayBufferStorage> storage);

  [[nodiscard]] int size();

  [[nodiscard]] std::shared_ptr<jsi::MutableBuffer> jsiMutableBuffer();

  [[nodiscard]] jni::local_ref<jni::JByteBuffer> toDirectBuffer(bool copyBorrowed);

  [[nodiscard]] bool isNativeBacked();

  template<class T>
  T read(int position) {
    return *reinterpret_cast<T *>(storage->data() + position);
  }

private:
  std::shared_ptr<ArrayBufferStorage> storage;
};

} // namespace expo
