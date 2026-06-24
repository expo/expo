#include "ArrayBuffer.h"

#include "Exceptions.h"
#include "JavaScriptRuntime.h"
#include "JSIContext.h"

namespace expo {

namespace {

enum class ScopedAccessPolicy {
  AllowCopy = 0,
  RequireZeroCopy = 1
};

[[noreturn]] void throwArrayBufferAccessException(const std::string &message) {
  throwNewJavaException(CodedException::create(message).get());
}

ScopedAccessPolicy parseScopedAccessPolicy(int policy) {
  switch (policy) {
    case 0:
      return ScopedAccessPolicy::AllowCopy;
    case 1:
      return ScopedAccessPolicy::RequireZeroCopy;
    default:
      throwArrayBufferAccessException("Invalid ArrayBuffer scoped access policy.");
  }
}

void validateByteRange(size_t storageSize, size_t position, size_t length) {
  if (position > storageSize || length > storageSize - position) {
    throwArrayBufferAccessException("ArrayBuffer byte access is out of bounds.");
  }
}

jni::local_ref<jni::JByteBuffer> copyToDirectBuffer(uint8_t *data, size_t length) {
  auto byteBuffer = jni::JByteBuffer::allocateDirect(static_cast<jint>(length));
  byteBuffer->order(jni::JByteOrder::nativeOrder());
  if (length > 0) {
    memcpy(byteBuffer->getDirectAddress(), data, length);
  }
  return byteBuffer;
}

jni::local_ref<jni::JObject> invokeBodyWithByteBuffer(
  jni::alias_ref<JNIFunctionBody::javaobject> body,
  jni::local_ref<jni::JByteBuffer> byteBuffer
) {
  JNIEnv *env = jni::Environment::current();
  auto objectClass = env->FindClass("java/lang/Object");
  throwPendingJniExceptionAsCppException();

  auto args = env->NewObjectArray(1, objectClass, nullptr);
  throwPendingJniExceptionAsCppException();

  env->SetObjectArrayElement(args, 0, byteBuffer.get());
  throwPendingJniExceptionAsCppException();

  return JNIFunctionBody::invoke(body.get(), args);
}

class ByteBufferJSIMutableBuffer: public jsi::MutableBuffer {
public:
  explicit ByteBufferJSIMutableBuffer(const jni::alias_ref<jni::JByteBuffer> &byteBuffer)
    : _byteBuffer(jni::make_global(byteBuffer)) {
    _byteBuffer->order(jni::JByteOrder::nativeOrder());
  }

  ~ByteBufferJSIMutableBuffer() override {
    jni::ThreadScope::WithClassLoader([&] { _byteBuffer.reset(); });
  }

  uint8_t *data() override {
    return _byteBuffer->getDirectBytes();
  }

  size_t size() const override {
    return _byteBuffer->getDirectSize();
  }

private:
  jni::global_ref<jni::JByteBuffer> _byteBuffer;
};

class MutableBufferViewJSIMutableBuffer: public jsi::MutableBuffer {
public:
  MutableBufferViewJSIMutableBuffer(
    std::shared_ptr<jsi::MutableBuffer> backingBuffer,
    size_t offset,
    size_t length
  ) : _backingBuffer(std::move(backingBuffer)),
      _offset(offset),
      _length(length) {}

  uint8_t *data() override {
    return _backingBuffer->data() + _offset;
  }

  size_t size() const override {
    return _length;
  }

private:
  std::shared_ptr<jsi::MutableBuffer> _backingBuffer;
  size_t _offset;
  size_t _length;
};

}

ByteBufferArrayBufferStorage::ByteBufferArrayBufferStorage(const jni::alias_ref<jni::JByteBuffer> &byteBuffer)
  : _byteBuffer(jni::make_global(byteBuffer)) {
  _byteBuffer->order(jni::JByteOrder::nativeOrder());
}

ByteBufferArrayBufferStorage::~ByteBufferArrayBufferStorage() {
  jni::ThreadScope::WithClassLoader([&] { _byteBuffer.reset(); });
}

uint8_t *ByteBufferArrayBufferStorage::data() {
  return _byteBuffer->getDirectBytes();
}

size_t ByteBufferArrayBufferStorage::size() const {
  return _byteBuffer->getDirectSize();
}

bool ByteBufferArrayBufferStorage::isNativeBacked() const noexcept {
  return true;
}

void ByteBufferArrayBufferStorage::readBytes(size_t position, void *destination, size_t length) {
  validateByteRange(size(), position, length);
  memcpy(destination, data() + position, length);
}

jni::local_ref<jni::JByteBuffer> ByteBufferArrayBufferStorage::toDirectBuffer(bool) {
  return jni::make_local(_byteBuffer);
}

std::shared_ptr<jsi::MutableBuffer> ByteBufferArrayBufferStorage::jsiMutableBuffer() {
  return std::make_shared<ByteBufferJSIMutableBuffer>(jni::make_local(_byteBuffer));
}

jsi::Value ByteBufferArrayBufferStorage::toJSIValue(jsi::Runtime &runtime) {
  return jsi::Value(runtime, runtime.createArrayBuffer(jsiMutableBuffer()));
}

jni::local_ref<jni::JObject> ByteBufferArrayBufferStorage::withJSBytes(
  int policy,
  jni::alias_ref<JNIFunctionBody::javaobject> body
) {
  parseScopedAccessPolicy(policy);
  return invokeBodyWithByteBuffer(body, toDirectBuffer(false));
}

jni::local_ref<jni::JObject> ByteBufferArrayBufferStorage::withMutableJSBytes(
  jni::alias_ref<JNIFunctionBody::javaobject> body
) {
  return invokeBodyWithByteBuffer(body, toDirectBuffer(false));
}

MutableBufferViewArrayBufferStorage::MutableBufferViewArrayBufferStorage(
  std::shared_ptr<jsi::MutableBuffer> backingBuffer,
  size_t offset,
  size_t length
) : _backingBuffer(std::move(backingBuffer)),
    _offset(offset),
    _length(length) {}

uint8_t *MutableBufferViewArrayBufferStorage::data() {
  return _backingBuffer->data() + _offset;
}

size_t MutableBufferViewArrayBufferStorage::size() const {
  return _length;
}

bool MutableBufferViewArrayBufferStorage::isNativeBacked() const noexcept {
  return true;
}

void MutableBufferViewArrayBufferStorage::readBytes(size_t position, void *destination, size_t length) {
  validateByteRange(size(), position, length);
  memcpy(destination, data() + position, length);
}

jni::local_ref<jni::JByteBuffer> MutableBufferViewArrayBufferStorage::toDirectBuffer(bool copyBorrowed) {
  if (copyBorrowed) {
    auto byteBuffer = jni::JByteBuffer::allocateDirect(static_cast<jint>(_length));
    byteBuffer->order(jni::JByteOrder::nativeOrder());
    memcpy(byteBuffer->getDirectAddress(), data(), _length);
    return byteBuffer;
  }

  auto byteBuffer = jni::JByteBuffer::wrapBytes(data(), _length);
  byteBuffer->order(jni::JByteOrder::nativeOrder());
  return byteBuffer;
}

std::shared_ptr<jsi::MutableBuffer> MutableBufferViewArrayBufferStorage::jsiMutableBuffer() {
  return std::make_shared<MutableBufferViewJSIMutableBuffer>(_backingBuffer, _offset, _length);
}

jsi::Value MutableBufferViewArrayBufferStorage::toJSIValue(jsi::Runtime &runtime) {
  return jsi::Value(runtime, runtime.createArrayBuffer(jsiMutableBuffer()));
}

jni::local_ref<jni::JObject> MutableBufferViewArrayBufferStorage::withJSBytes(
  int,
  jni::alias_ref<JNIFunctionBody::javaobject> body
) {
  return invokeBodyWithByteBuffer(body, toDirectBuffer(false));
}

jni::local_ref<jni::JObject> MutableBufferViewArrayBufferStorage::withMutableJSBytes(
  jni::alias_ref<JNIFunctionBody::javaobject> body
) {
  return invokeBodyWithByteBuffer(body, toDirectBuffer(false));
}

JavaScriptBackedArrayBufferStorage::JavaScriptBackedArrayBufferStorage(
  std::weak_ptr<JavaScriptRuntime> runtime,
  std::shared_ptr<jsi::ArrayBuffer> arrayBuffer,
  size_t offset,
  size_t length
) : _runtime(std::move(runtime)),
    _arrayBuffer(std::move(arrayBuffer)),
    _offset(offset),
    _length(length) {}

uint8_t *JavaScriptBackedArrayBufferStorage::data() {
  throwArrayBufferAccessException(
    "JavaScript-backed ArrayBuffer cannot expose raw data outside a scoped JavaScript access."
  );
}

size_t JavaScriptBackedArrayBufferStorage::size() const {
  return _length;
}

bool JavaScriptBackedArrayBufferStorage::isNativeBacked() const noexcept {
  return false;
}

std::shared_ptr<JavaScriptRuntime> JavaScriptBackedArrayBufferStorage::runtimeOrThrow() {
  auto runtime = _runtime.lock();
  if (!runtime) {
    throwArrayBufferAccessException("Cannot access JavaScript-backed ArrayBuffer after runtime deallocation.");
  }
  return runtime;
}

void JavaScriptBackedArrayBufferStorage::validateBounds(jsi::Runtime &runtime) {
  auto backingSize = _arrayBuffer->size(runtime);
  if (_offset > backingSize || _length > backingSize - _offset) {
    throwArrayBufferAccessException("JavaScript-backed ArrayBuffer view is out of bounds.");
  }
}

void JavaScriptBackedArrayBufferStorage::readBytes(size_t position, void *destination, size_t length) {
  validateByteRange(size(), position, length);
  auto runtime = runtimeOrThrow();
  std::exception_ptr exception;

  try {
    runtime->executeSync([&](jsi::Runtime &rt) {
      try {
        validateBounds(rt);
        memcpy(destination, _arrayBuffer->data(rt) + _offset + position, length);
      } catch (...) {
        exception = std::current_exception();
      }
    });
  } catch (...) {
    exception = std::current_exception();
  }

  if (exception) {
    std::rethrow_exception(exception);
  }
}

jni::local_ref<jni::JByteBuffer> JavaScriptBackedArrayBufferStorage::toDirectBuffer(bool) {
  auto runtime = runtimeOrThrow();
  jni::global_ref<jni::JByteBuffer> result;
  std::exception_ptr exception;

  try {
    runtime->executeSync([&](jsi::Runtime &rt) {
      try {
        validateBounds(rt);
        auto byteBuffer = copyToDirectBuffer(_arrayBuffer->data(rt) + _offset, _length);
        result = jni::make_global(byteBuffer);
      } catch (...) {
        exception = std::current_exception();
      }
    });
  } catch (...) {
    exception = std::current_exception();
  }

  if (exception) {
    std::rethrow_exception(exception);
  }

  return jni::make_local(result);
}

std::shared_ptr<jsi::MutableBuffer> JavaScriptBackedArrayBufferStorage::jsiMutableBuffer() {
  auto byteBuffer = toDirectBuffer(true);
  return std::make_shared<ByteBufferJSIMutableBuffer>(byteBuffer);
}

jsi::Value JavaScriptBackedArrayBufferStorage::toJSIValue(jsi::Runtime &runtime) {
  if (auto sourceRuntime = _runtime.lock()) {
    if (&sourceRuntime->get() == &runtime) {
      validateBounds(runtime);
      if (_offset == 0 && _length == _arrayBuffer->size(runtime)) {
        return jsi::Value(runtime, *_arrayBuffer);
      }
      auto byteBuffer = copyToDirectBuffer(_arrayBuffer->data(runtime) + _offset, _length);
      auto mutableBuffer = std::make_shared<ByteBufferJSIMutableBuffer>(byteBuffer);
      return jsi::Value(runtime, runtime.createArrayBuffer(std::move(mutableBuffer)));
    }
  }

  return jsi::Value(runtime, runtime.createArrayBuffer(jsiMutableBuffer()));
}

jni::local_ref<jni::JObject> JavaScriptBackedArrayBufferStorage::withJSBytes(
  int policy,
  jni::alias_ref<JNIFunctionBody::javaobject> body
) {
  auto accessPolicy = parseScopedAccessPolicy(policy);
  auto runtime = runtimeOrThrow();
  auto bodyRef = jni::make_global(body);
  jni::global_ref<jni::JObject> result;
  bool hasResult = false;
  std::exception_ptr exception;

  try {
    runtime->executeSync([&](jsi::Runtime &rt) {
      try {
        validateBounds(rt);
        // Both policies use zero-copy here. `RequireZeroCopy` is kept explicit so
        // unsupported fallback paths cannot accidentally start copying later.
        if (accessPolicy == ScopedAccessPolicy::RequireZeroCopy) {
          validateBounds(rt);
        }
        auto byteBuffer = jni::JByteBuffer::wrapBytes(_arrayBuffer->data(rt) + _offset, _length);
        byteBuffer->order(jni::JByteOrder::nativeOrder());
        auto localBody = jni::static_ref_cast<JNIFunctionBody>(bodyRef);
        auto localResult = invokeBodyWithByteBuffer(localBody, std::move(byteBuffer));
        hasResult = true;
        if (localResult) {
          result = jni::make_global(localResult);
        }
      } catch (...) {
        exception = std::current_exception();
      }
    });
  } catch (...) {
    exception = std::current_exception();
  }

  if (exception) {
    std::rethrow_exception(exception);
  }

  if (!hasResult || !result) {
    return nullptr;
  }
  return jni::make_local(result);
}

jni::local_ref<jni::JObject> JavaScriptBackedArrayBufferStorage::withMutableJSBytes(
  jni::alias_ref<JNIFunctionBody::javaobject> body
) {
  return withJSBytes(1, body);
}

void ArrayBuffer::registerNatives() {
  registerHybrid({
                   makeNativeMethod("initHybrid", ArrayBuffer::initHybrid),
                   makeNativeMethod("size", ArrayBuffer::size),
                   makeNativeMethod("readByte", ArrayBuffer::read<int8_t>),
                   makeNativeMethod("read2Byte", ArrayBuffer::read<int16_t>),
                   makeNativeMethod("read4Byte", ArrayBuffer::read<int32_t>),
                   makeNativeMethod("read8Byte", ArrayBuffer::read<int64_t>),
                   makeNativeMethod("readFloat", ArrayBuffer::read<float>),
                   makeNativeMethod("readDouble", ArrayBuffer::read<double>),
                   makeNativeMethod("toDirectBuffer", ArrayBuffer::toDirectBuffer),
                   makeNativeMethod("isNativeBacked", ArrayBuffer::isNativeBacked),
                   makeNativeMethod("withJSBytes", ArrayBuffer::withJSBytes),
                   makeNativeMethod("withMutableJSBytes", ArrayBuffer::withMutableJSBytes),
                 });
}

jni::local_ref<ArrayBuffer::jhybriddata> ArrayBuffer::initHybrid(
  jni::alias_ref<JavaPart::javaobject>,
  jni::alias_ref<jni::JByteBuffer> byteBuffer
) {
  return makeCxxInstance(byteBuffer);
}

jni::local_ref<ArrayBuffer::javaobject>
ArrayBuffer::newInstance(JSIContext *jsiContext, jsi::Runtime &runtime,
                         jsi::ArrayBuffer arrayBuffer) {
  auto mutableBuffer = arrayBuffer.tryGetMutableBuffer(runtime);
  if (mutableBuffer) {
    auto storage = std::make_shared<MutableBufferViewArrayBufferStorage>(
      std::move(mutableBuffer),
      0,
      arrayBuffer.size(runtime)
    );
    auto value = ArrayBuffer::newObjectCxxArgs(std::move(storage));
    jsiContext->jniDeallocator->addReference(value);
    return value;
  }

  size_t size = arrayBuffer.size(runtime);

  if (size > 0 && jsiContext->runtimeHolder->supportsSyncExecution()) {
    auto storage = std::make_shared<JavaScriptBackedArrayBufferStorage>(
      jsiContext->runtimeHolder,
      std::make_shared<jsi::ArrayBuffer>(std::move(arrayBuffer)),
      0,
      size
    );
    auto value = ArrayBuffer::newObjectCxxArgs(std::move(storage));
    jsiContext->jniDeallocator->addReference(value);
    return value;
  }

  auto byteBuffer = jni::JByteBuffer::allocateDirect(static_cast<jint>(size));
  byteBuffer->order(jni::JByteOrder::nativeOrder());
  memcpy(byteBuffer->getDirectAddress(), arrayBuffer.data(runtime), size);

  auto value = ArrayBuffer::newObjectCxxArgs(byteBuffer);
  jsiContext->jniDeallocator->addReference(value);
  return value;
}

jni::local_ref<ArrayBuffer::javaobject> ArrayBuffer::newInstance(
  JSIContext *jsiContext,
  jsi::Runtime &runtime,
  expo::TypedArray &typedArray
) {
  size_t size = typedArray.byteLength(runtime);

  auto backingBuffer = typedArray.getBuffer(runtime);
  auto mutableBuffer = backingBuffer.tryGetMutableBuffer(runtime);
  if (mutableBuffer) {
    size_t offset = typedArray.byteOffset(runtime);
    auto storage = std::make_shared<MutableBufferViewArrayBufferStorage>(
      std::move(mutableBuffer),
      offset,
      size
    );
    auto value = ArrayBuffer::newObjectCxxArgs(std::move(storage));
    jsiContext->jniDeallocator->addReference(value);
    return value;
  }

  if (size > 0 && jsiContext->runtimeHolder->supportsSyncExecution()) {
    size_t offset = typedArray.byteOffset(runtime);
    auto storage = std::make_shared<JavaScriptBackedArrayBufferStorage>(
      jsiContext->runtimeHolder,
      std::make_shared<jsi::ArrayBuffer>(std::move(backingBuffer)),
      offset,
      size
    );
    auto value = ArrayBuffer::newObjectCxxArgs(std::move(storage));
    jsiContext->jniDeallocator->addReference(value);
    return value;
  }

  auto byteBuffer = jni::JByteBuffer::allocateDirect(static_cast<jint>(size));
  byteBuffer->order(jni::JByteOrder::nativeOrder());
  memcpy(byteBuffer->getDirectAddress(), typedArray.getRawPointer(runtime), size);

  auto value = ArrayBuffer::newObjectCxxArgs(byteBuffer);
  jsiContext->jniDeallocator->addReference(value);
  return value;
}

ArrayBuffer::ArrayBuffer(const jni::alias_ref<jni::JByteBuffer> &byteBuffer)
  : storage(std::make_shared<ByteBufferArrayBufferStorage>(byteBuffer)) { }

ArrayBuffer::ArrayBuffer(std::shared_ptr<ArrayBufferStorage> storage)
  : storage(std::move(storage)) { }

int ArrayBuffer::size() {
  return (int) storage->size();
}

std::shared_ptr<jsi::MutableBuffer> ArrayBuffer::jsiMutableBuffer() {
  return storage->jsiMutableBuffer();
}

jsi::Value ArrayBuffer::toJSIValue(jsi::Runtime &runtime) {
  return storage->toJSIValue(runtime);
}

jni::local_ref<jni::JByteBuffer> ArrayBuffer::toDirectBuffer(bool copyBorrowed) {
  auto byteBuffer = storage->toDirectBuffer(copyBorrowed);
  if (!storage->isNativeBacked()) {
    storage = std::make_shared<ByteBufferArrayBufferStorage>(byteBuffer);
  }
  return byteBuffer;
}

bool ArrayBuffer::isNativeBacked() {
  return storage->isNativeBacked();
}

jni::local_ref<jni::JObject> ArrayBuffer::withJSBytes(
  int policy,
  jni::alias_ref<JNIFunctionBody::javaobject> body
) {
  return storage->withJSBytes(policy, body);
}

jni::local_ref<jni::JObject> ArrayBuffer::withMutableJSBytes(
  jni::alias_ref<JNIFunctionBody::javaobject> body
) {
  return storage->withMutableJSBytes(body);
}

uint8_t *ArrayBuffer::data() {
  if (!storage->isNativeBacked()) {
    auto byteBuffer = storage->toDirectBuffer(true);
    storage = std::make_shared<ByteBufferArrayBufferStorage>(byteBuffer);
  }
  return storage->data();
}

}
