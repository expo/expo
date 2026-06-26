#include "ArrayBuffer.h"

#include "Exceptions.h"
#include "JavaScriptRuntime.h"
#include "JSIContext.h"

namespace expo {

namespace {

[[noreturn]] void throwArrayBufferAccessException(const std::string &message) {
  throwNewJavaException(CodedException::create(message).get());
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

void invokeScopedAccessAsyncCallback(
  jni::alias_ref<ArrayBufferScopedAccessAsyncCallback::javaobject> callback,
  jni::local_ref<jni::JObject> result,
  jni::local_ref<jni::JThrowable> error
) {
  ArrayBufferScopedAccessAsyncCallback::invoke(
    callback.get(),
    result ? result.get() : nullptr,
    error ? error.get() : nullptr
  );
}

void invokeScopedAccessBodyAsync(
  jni::alias_ref<ArrayBufferScopedAccessAsyncCallback::javaobject> callback,
  const std::function<jni::local_ref<jni::JObject>()> &body
) {
  try {
    invokeScopedAccessAsyncCallback(callback, body(), nullptr);
  } catch (jni::JniException &exception) {
    invokeScopedAccessAsyncCallback(callback, nullptr, exception.getThrowable());
  } catch (const std::exception &exception) {
    invokeScopedAccessAsyncCallback(callback, nullptr, UnexpectedException::create(exception.what()));
  } catch (...) {
    invokeScopedAccessAsyncCallback(
      callback,
      nullptr,
      UnexpectedException::create("Unknown ArrayBuffer scoped access exception.")
    );
  }
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

jni::local_ref<ArrayBuffer::javaobject> makeArrayBufferObject(
  JSIContext *jsiContext,
  std::shared_ptr<ArrayBufferStorage> storage
) {
  auto value = ArrayBuffer::newObjectCxxArgs(std::move(storage));
  jsiContext->jniDeallocator->addReference(value);
  return value;
}

jni::local_ref<ArrayBuffer::javaobject> makeArrayBufferObject(
  JSIContext *jsiContext,
  jni::alias_ref<jni::JByteBuffer> byteBuffer
) {
  auto value = ArrayBuffer::newObjectCxxArgs(byteBuffer);
  jsiContext->jniDeallocator->addReference(value);
  return value;
}

std::shared_ptr<JSHeapAccessExecutorHolder> getJSHeapAccessExecutor(JSIContext *jsiContext) {
  if (jsiContext->jsHeapAccessExecutor) {
    return jsiContext->jsHeapAccessExecutor;
  }
  static const auto method = JSIContext::javaClassStatic()
    ->getMethod<jni::local_ref<JSHeapAccessExecutorJavaClass::javaobject>()>("getJSHeapAccessExecutor");
  auto executor = method(jsiContext->javaPart_);
  if (!executor) {
    return nullptr;
  }
  jsiContext->jsHeapAccessExecutor = std::make_shared<JSHeapAccessExecutorHolder>(executor);
  return jsiContext->jsHeapAccessExecutor;
}

jni::local_ref<ArrayBuffer::javaobject> makeArrayBufferFromJSIArrayBuffer(
  JSIContext *jsiContext,
  jsi::Runtime &runtime,
  jsi::ArrayBuffer arrayBuffer,
  size_t offset,
  size_t length,
  const std::function<uint8_t *(jsi::ArrayBuffer &)> &copySourceProvider
) {
  auto mutableBuffer = arrayBuffer.tryGetMutableBuffer(runtime);
  if (mutableBuffer) {
    return makeArrayBufferObject(
      jsiContext,
      std::make_shared<MutableBufferViewArrayBufferStorage>(
        std::move(mutableBuffer),
        offset,
        length
      )
    );
  }

  auto executor = getJSHeapAccessExecutor(jsiContext);
  if (length > 0 && executor) {
    return makeArrayBufferObject(
      jsiContext,
      std::make_shared<JavaScriptBackedArrayBufferStorage>(
        jsiContext->runtimeHolder,
        std::move(executor),
        std::make_shared<jsi::ArrayBuffer>(std::move(arrayBuffer)),
        offset,
        length
      )
    );
  }

  auto byteBuffer = copyToDirectBuffer(length > 0 ? copySourceProvider(arrayBuffer) : nullptr, length);
  return makeArrayBufferObject(jsiContext, byteBuffer);
}

}

void ArrayBufferScopedAccessAsyncCallback::invoke(
  jobject self,
  jobject result,
  jthrowable error
) {
  static const auto method = jni::findClassLocal("expo/modules/kotlin/jni/ArrayBufferScopedAccessAsyncCallback")
    ->getMethod<void(jobject, jthrowable)>(
      "invoke",
      "(Ljava/lang/Object;Ljava/lang/Throwable;)V"
    );

  jvalue args[2];
  args[0].l = result;
  args[1].l = error;
  jni::Environment::current()->CallVoidMethodA(self, method.getId(), args);
  throwPendingJniExceptionAsCppException();
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
  jni::alias_ref<JNIFunctionBody::javaobject> body
) {
  return invokeBodyWithByteBuffer(body, toDirectBuffer(false));
}

JavaScriptBackedArrayBufferStorage::JavaScriptBackedArrayBufferStorage(
  std::weak_ptr<JavaScriptRuntime> runtime,
  std::shared_ptr<JSHeapAccessExecutorHolder> executor,
  std::shared_ptr<jsi::ArrayBuffer> arrayBuffer,
  size_t offset,
  size_t length
) : _runtime(std::move(runtime)),
    _executor(std::move(executor)),
    _arrayBuffer(std::move(arrayBuffer)),
    _offset(offset),
    _length(length) {}

JavaScriptBackedArrayBufferStorage::~JavaScriptBackedArrayBufferStorage() {
  auto arrayBuffer = new std::shared_ptr<jsi::ArrayBuffer>(std::move(_arrayBuffer));
  try {
    _executor->runSync([arrayBuffer]() {
      delete arrayBuffer;
    });
  } catch (...) {
    // If the JS queue is no longer available, intentionally leak the retained JS handle
    // instead of destroying it from a non-JS thread.
  }
}

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
  (void)runtime;
  std::exception_ptr exception;

  try {
    _executor->runSync([this, runtime, position, destination, length, &exception]() {
      try {
        jsi::Runtime &rt = runtime->get();
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
  (void)runtime;
  jni::global_ref<jni::JByteBuffer> result;
  std::exception_ptr exception;

  try {
    _executor->runSync([this, runtime, &result, &exception]() {
      try {
        jsi::Runtime &rt = runtime->get();
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
  jni::alias_ref<JNIFunctionBody::javaobject> body
) {
  auto runtime = runtimeOrThrow();
  (void)runtime;
  auto bodyRef = jni::make_global(body);
  jni::global_ref<jni::JObject> result;
  bool hasResult = false;
  std::exception_ptr exception;

  try {
    _executor->runSync([this, runtime, &bodyRef, &result, &hasResult, &exception]() {
      try {
        jsi::Runtime &rt = runtime->get();
        validateBounds(rt);
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

void JavaScriptBackedArrayBufferStorage::withJSBytesAsync(
  jni::alias_ref<JNIFunctionBody::javaobject> body,
  jni::alias_ref<ArrayBufferScopedAccessAsyncCallback::javaobject> callback
) {
  auto runtime = runtimeOrThrow();
  auto self = std::static_pointer_cast<JavaScriptBackedArrayBufferStorage>(shared_from_this());
  auto bodyRef = jni::make_global(body);
  auto callbackRef = jni::make_global(callback);

  bool wasQueued = _executor->runAsync([
    self = std::move(self),
    runtime = std::move(runtime),
    bodyRef = std::move(bodyRef),
    callbackRef = std::move(callbackRef)
  ]() mutable {
    auto localCallback = jni::static_ref_cast<ArrayBufferScopedAccessAsyncCallback>(callbackRef);
    invokeScopedAccessBodyAsync(localCallback, [&]() {
      jsi::Runtime &rt = runtime->get();
      self->validateBounds(rt);
      auto byteBuffer = jni::JByteBuffer::wrapBytes(self->_arrayBuffer->data(rt) + self->_offset, self->_length);
      byteBuffer->order(jni::JByteOrder::nativeOrder());
      auto localBody = jni::static_ref_cast<JNIFunctionBody>(bodyRef);
      return invokeBodyWithByteBuffer(localBody, std::move(byteBuffer));
    });
    self.reset();
  });
  if (!wasQueued) {
    invokeScopedAccessAsyncCallback(
      callback,
      nullptr,
      UnexpectedException::create("Cannot schedule ArrayBuffer access on the JavaScript queue.")
    );
  }
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
                   makeNativeMethod("withJSBytesAsync", ArrayBuffer::withJSBytesAsync),
                 });
}

jni::local_ref<ArrayBuffer::jhybriddata> ArrayBuffer::initHybrid(
  jni::alias_ref<JavaPart::javaobject>,
  jni::alias_ref<jni::JByteBuffer> byteBuffer
) {
  return makeCxxInstance(byteBuffer);
}

jni::local_ref<ArrayBuffer::javaobject> ArrayBuffer::newInstance(
  JSIContext *jsiContext,
  jsi::Runtime &runtime,
  jsi::ArrayBuffer arrayBuffer
) {
  auto size = arrayBuffer.size(runtime);
  return makeArrayBufferFromJSIArrayBuffer(
    jsiContext,
    runtime,
    std::move(arrayBuffer),
    0,
    size,
    [&runtime](jsi::ArrayBuffer &buffer) {
      return buffer.data(runtime);
    }
  );
}

jni::local_ref<ArrayBuffer::javaobject> ArrayBuffer::newInstance(
  JSIContext *jsiContext,
  jsi::Runtime &runtime,
  expo::TypedArray &typedArray
) {
  size_t size = typedArray.byteLength(runtime);
  auto backingBuffer = typedArray.getBuffer(runtime);
  return makeArrayBufferFromJSIArrayBuffer(
    jsiContext,
    runtime,
    std::move(backingBuffer),
    typedArray.byteOffset(runtime),
    size,
    [&runtime, &typedArray](jsi::ArrayBuffer &) {
      return static_cast<uint8_t *>(typedArray.getRawPointer(runtime));
    }
  );
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
  std::lock_guard<std::mutex> lock(storageMutex_);
  auto byteBuffer = storage->toDirectBuffer(copyBorrowed);
  if (!storage->isNativeBacked()) {
    storage = std::make_shared<ByteBufferArrayBufferStorage>(byteBuffer);
  }
  return byteBuffer;
}

bool ArrayBuffer::isNativeBacked() {
  std::lock_guard<std::mutex> lock(storageMutex_);
  return storage->isNativeBacked();
}

jni::local_ref<jni::JObject> ArrayBuffer::withJSBytes(
  jni::alias_ref<JNIFunctionBody::javaobject> body
) {
  std::unique_lock<std::mutex> lock(storageMutex_);
  auto localStorage = storage;
  lock.unlock();
  return localStorage->withJSBytes(body);
}

void ArrayBuffer::withJSBytesAsync(
  jni::alias_ref<JNIFunctionBody::javaobject> body,
  jni::alias_ref<ArrayBufferScopedAccessAsyncCallback::javaobject> callback
) {
  std::unique_lock<std::mutex> lock(storageMutex_);
  auto localStorage = storage;
  lock.unlock();

  if (auto jsStorage = std::dynamic_pointer_cast<JavaScriptBackedArrayBufferStorage>(localStorage)) {
    jsStorage->withJSBytesAsync(body, callback);
    return;
  }

  invokeScopedAccessBodyAsync(callback, [&]() {
    return localStorage->withJSBytes(body);
  });
}

uint8_t *ArrayBuffer::data() {
  std::lock_guard<std::mutex> lock(storageMutex_);
  if (!storage->isNativeBacked()) {
    auto byteBuffer = storage->toDirectBuffer(true);
    storage = std::make_shared<ByteBufferArrayBufferStorage>(byteBuffer);
  }
  return storage->data();
}

}
