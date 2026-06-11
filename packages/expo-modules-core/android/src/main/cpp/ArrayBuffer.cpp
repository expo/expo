#include "ArrayBuffer.h"

#include "JavaScriptRuntime.h"
#include "JSIContext.h"

namespace expo {

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

bool ByteBufferArrayBufferStorage::isOwned() const noexcept {
  return true;
}

jni::local_ref<jni::JByteBuffer> ByteBufferArrayBufferStorage::toDirectBuffer(bool) {
  return jni::make_local(_byteBuffer);
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

bool MutableBufferViewArrayBufferStorage::isOwned() const noexcept {
  return false;
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
                   makeNativeMethod("isOwned", ArrayBuffer::isOwned),
                 });
}

jni::local_ref<ArrayBuffer::jhybriddata>
ArrayBuffer::initHybrid(jni::alias_ref<JavaPart::javaobject>,
                        jni::alias_ref<jni::JByteBuffer> byteBuffer) {
  return makeCxxInstance(byteBuffer);
}

jni::local_ref<ArrayBuffer::javaobject>
ArrayBuffer::newInstance(JSIContext *jsiContext, jsi::Runtime &runtime,
                         jsi::ArrayBuffer &arrayBuffer) {
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
  auto byteBuffer = jni::JByteBuffer::allocateDirect(size);
  byteBuffer->order(jni::JByteOrder::nativeOrder());
  memcpy(byteBuffer->getDirectAddress(), arrayBuffer.data(runtime), size);

  auto value = ArrayBuffer::newObjectCxxArgs(byteBuffer);
  jsiContext->jniDeallocator->addReference(value);
  return value;
}

jni::local_ref<ArrayBuffer::javaobject>
ArrayBuffer::newInstance(JSIContext *jsiContext, jsi::Runtime &runtime,
                         expo::TypedArray& typedArray) {
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
  return this->storage;
}

jni::local_ref<jni::JByteBuffer> ArrayBuffer::toDirectBuffer(bool copyBorrowed) {
  return storage->toDirectBuffer(copyBorrowed);
}

bool ArrayBuffer::isOwned() {
  return storage->isOwned();
}

}
