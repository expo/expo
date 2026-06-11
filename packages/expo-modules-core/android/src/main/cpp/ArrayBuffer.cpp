#include "ArrayBuffer.h"

#include "JavaScriptRuntime.h"
#include "JSIContext.h"

namespace expo {

ArrayBufferByteBufferWrapper::ArrayBufferByteBufferWrapper(const jni::alias_ref<jni::JByteBuffer> &byteBuffer) : _byteBuffer(jni::make_global(byteBuffer)) {
  _byteBuffer->order(jni::JByteOrder::nativeOrder());
}

ArrayBufferByteBufferWrapper::ArrayBufferByteBufferWrapper(
  const jni::alias_ref<jni::JByteBuffer> &byteBuffer,
  std::shared_ptr<jsi::MutableBuffer> retainedBuffer
) : _byteBuffer(jni::make_global(byteBuffer)),
    _retainedBuffer(std::move(retainedBuffer)) {
  _byteBuffer->order(jni::JByteOrder::nativeOrder());
}

ArrayBufferByteBufferWrapper::~ArrayBufferByteBufferWrapper() {
  jni::ThreadScope::WithClassLoader([&] { _byteBuffer.reset(); });
}

uint8_t *ArrayBufferByteBufferWrapper::data() {
  return _byteBuffer->getDirectBytes();
}

size_t ArrayBufferByteBufferWrapper::size() const {
  return _byteBuffer->getDirectSize();
}

const jni::global_ref<jni::JByteBuffer> &ArrayBufferByteBufferWrapper::getBuffer() const {
  return this->_byteBuffer;
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
    auto byteBuffer = jni::JByteBuffer::wrapBytes(mutableBuffer->data(), mutableBuffer->size());
    byteBuffer->order(jni::JByteOrder::nativeOrder());
    auto value = ArrayBuffer::newObjectCxxArgs(byteBuffer, std::move(mutableBuffer));
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
    auto byteBuffer = jni::JByteBuffer::wrapBytes(
      mutableBuffer->data() + offset, size);
    byteBuffer->order(jni::JByteOrder::nativeOrder());
    auto value = ArrayBuffer::newObjectCxxArgs(byteBuffer, std::move(mutableBuffer));
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
  : buffer(std::make_shared<ArrayBufferByteBufferWrapper>(byteBuffer)) { }

ArrayBuffer::ArrayBuffer(
  const jni::alias_ref<jni::JByteBuffer> &byteBuffer,
  std::shared_ptr<jsi::MutableBuffer> retainedBuffer
) : buffer(std::make_shared<ArrayBufferByteBufferWrapper>(byteBuffer, std::move(retainedBuffer))) { }

int ArrayBuffer::size() {
  return (int) buffer->size();
}

std::shared_ptr<ArrayBufferByteBufferWrapper> ArrayBuffer::jsiMutableBuffer() {
  return this->buffer;
}

jni::local_ref<jni::JByteBuffer> ArrayBuffer::toDirectBuffer() {
  return jni::make_local(buffer->getBuffer());
}

}
