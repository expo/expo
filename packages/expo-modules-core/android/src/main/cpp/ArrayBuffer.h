#pragma once

#include "ExpoHeader.pch"
#include "JNIFunctionBody.h"
#include "JNIDeallocator.h"
#include "JSIContext.h"
#include "JSHeapAccessExecutorHolder.h"
#include "TypedArray.h"

#include <fbjni/ByteBuffer.h>

namespace expo {

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

class JavaScriptRuntime;

class ArrayBufferScopedAccessAsyncCallback : public jni::JavaClass<ArrayBufferScopedAccessAsyncCallback> {
public:
  static auto constexpr kJavaDescriptor = "Lexpo/modules/kotlin/jni/ArrayBufferScopedAccessAsyncCallback;";

  static void invoke(
    jobject self,
    jobject result,
    jthrowable error
  );
};

class ArrayBufferStorage : public std::enable_shared_from_this<ArrayBufferStorage> {
public:
  virtual ~ArrayBufferStorage() = default;

  [[nodiscard]] virtual bool isNativeBacked() const noexcept = 0;

  [[nodiscard]] virtual uint8_t* data() = 0;

  [[nodiscard]] virtual size_t size() const = 0;

  virtual void readBytes(size_t position, void *destination, size_t length) = 0;

  [[nodiscard]] virtual jni::local_ref<jni::JByteBuffer> toDirectBuffer(bool copyBorrowed) = 0;

  [[nodiscard]] virtual std::shared_ptr<jsi::MutableBuffer> jsiMutableBuffer() = 0;

  [[nodiscard]] virtual jsi::Value toJSIValue(jsi::Runtime &runtime) = 0;

  [[nodiscard]] virtual jni::local_ref<jni::JObject> withJSBytes(
    jni::alias_ref<JNIFunctionBody::javaobject> body
  ) = 0;
};

class ByteBufferArrayBufferStorage : public ArrayBufferStorage {
public:
  explicit ByteBufferArrayBufferStorage(const jni::alias_ref<jni::JByteBuffer> &byteBuffer);

  ~ByteBufferArrayBufferStorage() override;

  [[nodiscard]] uint8_t* data() override;

  [[nodiscard]] size_t size() const override;

  void readBytes(size_t position, void *destination, size_t length) override;

  [[nodiscard]] bool isNativeBacked() const noexcept override;

  [[nodiscard]] jni::local_ref<jni::JByteBuffer> toDirectBuffer(bool copyBorrowed) override;

  [[nodiscard]] std::shared_ptr<jsi::MutableBuffer> jsiMutableBuffer() override;

  [[nodiscard]] jsi::Value toJSIValue(jsi::Runtime &runtime) override;

  [[nodiscard]] jni::local_ref<jni::JObject> withJSBytes(
    jni::alias_ref<JNIFunctionBody::javaobject> body
  ) override;

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

  void readBytes(size_t position, void *destination, size_t length) override;

  [[nodiscard]] bool isNativeBacked() const noexcept override;

  [[nodiscard]] jni::local_ref<jni::JByteBuffer> toDirectBuffer(bool copyBorrowed) override;

  [[nodiscard]] std::shared_ptr<jsi::MutableBuffer> jsiMutableBuffer() override;

  [[nodiscard]] jsi::Value toJSIValue(jsi::Runtime &runtime) override;

  [[nodiscard]] jni::local_ref<jni::JObject> withJSBytes(
    jni::alias_ref<JNIFunctionBody::javaobject> body
  ) override;

private:
  std::shared_ptr<jsi::MutableBuffer> _backingBuffer;
  size_t _offset;
  size_t _length;
};

class JavaScriptBackedArrayBufferStorage: public ArrayBufferStorage {
public:
  JavaScriptBackedArrayBufferStorage(
    std::weak_ptr<JavaScriptRuntime> runtime,
    std::shared_ptr<JSHeapAccessExecutorHolder> executor,
    std::shared_ptr<jsi::ArrayBuffer> arrayBuffer,
    size_t offset,
    size_t length
  );

  ~JavaScriptBackedArrayBufferStorage() override;

  [[nodiscard]] uint8_t* data() override;

  [[nodiscard]] size_t size() const override;

  void readBytes(size_t position, void *destination, size_t length) override;

  [[nodiscard]] bool isNativeBacked() const noexcept override;

  [[nodiscard]] jni::local_ref<jni::JByteBuffer> toDirectBuffer(bool copyBorrowed) override;

  [[nodiscard]] std::shared_ptr<jsi::MutableBuffer> jsiMutableBuffer() override;

  [[nodiscard]] jsi::Value toJSIValue(jsi::Runtime &runtime) override;

  [[nodiscard]] jni::local_ref<jni::JObject> withJSBytes(
    jni::alias_ref<JNIFunctionBody::javaobject> body
  ) override;

  void withJSBytesAsync(
    jni::alias_ref<JNIFunctionBody::javaobject> body,
    jni::alias_ref<ArrayBufferScopedAccessAsyncCallback::javaobject> callback
  );

private:
  [[nodiscard]] std::shared_ptr<JavaScriptRuntime> runtimeOrThrow();

  void validateBounds(jsi::Runtime &runtime);

  std::weak_ptr<JavaScriptRuntime> _runtime;
  std::shared_ptr<JSHeapAccessExecutorHolder> _executor;
  std::shared_ptr<jsi::ArrayBuffer> _arrayBuffer;
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
    jsi::Runtime& runtime,
    jsi::ArrayBuffer arrayBuffer
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

  [[nodiscard]] jsi::Value toJSIValue(jsi::Runtime &runtime);

  [[nodiscard]] jni::local_ref<jni::JByteBuffer> toDirectBuffer(bool copyBorrowed);

  [[nodiscard]] bool isNativeBacked();

  [[nodiscard]] jni::local_ref<jni::JObject> withJSBytes(
    jni::alias_ref<JNIFunctionBody::javaobject> body
  );

  void withJSBytesAsync(
    jni::alias_ref<JNIFunctionBody::javaobject> body,
    jni::alias_ref<ArrayBufferScopedAccessAsyncCallback::javaobject> callback
  );

  [[nodiscard]] uint8_t* data();

  template<class T>
  T read(int position) {
    T result;
    storage->readBytes(position, &result, sizeof(T));
    return result;
  }

private:
  std::shared_ptr<ArrayBufferStorage> storage;
};

} // namespace expo
