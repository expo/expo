#include "NativeArrayBuffer.h"

#include "JavaScriptRuntime.h"
#include "JSIContext.h"

namespace expo {

ByteBufferJSIWrapper::ByteBufferJSIWrapper(const jni::alias_ref<jni::JByteBuffer> &byteBuffer) : _byteBuffer(jni::make_global(byteBuffer)) {
  _byteBuffer->order(jni::JByteOrder::nativeOrder());
}

ByteBufferJSIWrapper::~ByteBufferJSIWrapper() {
  // Destruction can happen on JS thread
  jni::ThreadScope::WithClassLoader([&] { _byteBuffer.reset(); });
}

uint8_t *ByteBufferJSIWrapper::data() {
  return _byteBuffer->getDirectBytes();
}

size_t ByteBufferJSIWrapper::size() const {
  return _byteBuffer->getDirectSize();
}

const jni::global_ref<jni::JByteBuffer> &ByteBufferJSIWrapper::getBuffer() const {
  return this->_byteBuffer;
}

void NativeArrayBuffer::registerNatives() {
  registerHybrid({
                   makeNativeMethod("initHybrid", NativeArrayBuffer::initHybrid),
                   makeNativeMethod("size", NativeArrayBuffer::size),
                   makeNativeMethod("readByte", NativeArrayBuffer::read<int8_t>),
                   makeNativeMethod("read2Byte", NativeArrayBuffer::read<int16_t>),
                   makeNativeMethod("read4Byte", NativeArrayBuffer::read<int32_t>),
                   makeNativeMethod("read8Byte", NativeArrayBuffer::read<int64_t>),
                   makeNativeMethod("readFloat", NativeArrayBuffer::read<float>),
                   makeNativeMethod("readDouble", NativeArrayBuffer::read<double>),
                   makeNativeMethod("toDirectBuffer", NativeArrayBuffer::toDirectBuffer),
                 });
}

jni::local_ref<NativeArrayBuffer::jhybriddata>
NativeArrayBuffer::initHybrid(jni::alias_ref<JavaPart::javaobject>,
                              jni::alias_ref<jni::JByteBuffer> byteBuffer) {
  return makeCxxInstance(byteBuffer);
}

jni::local_ref<NativeArrayBuffer::javaobject>
NativeArrayBuffer::newInstance(JSIContext *jsiContext, jsi::Runtime &runtime,
                               jsi::ArrayBuffer &arrayBuffer) {
  size_t size = arrayBuffer.size(runtime);
  auto byteBuffer = jni::JByteBuffer::allocateDirect(size);
  byteBuffer->order(jni::JByteOrder::nativeOrder());
  memcpy(byteBuffer->getDirectAddress(), arrayBuffer.data(runtime), size);

  auto value = NativeArrayBuffer::newObjectCxxArgs(byteBuffer);
  jsiContext->jniDeallocator->addReference(value);
  return value;
}

NativeArrayBuffer::NativeArrayBuffer(const jni::alias_ref<jni::JByteBuffer> &byteBuffer)
  : buffer(std::make_shared<ByteBufferJSIWrapper>(byteBuffer)) { }

int NativeArrayBuffer::size() {
  return (int) buffer->size();
}

std::shared_ptr<ByteBufferJSIWrapper> NativeArrayBuffer::jsiMutableBuffer() {
  return this->buffer;
}

jni::local_ref<jni::JByteBuffer> NativeArrayBuffer::toDirectBuffer() {
  return jni::make_local(buffer->getBuffer());
}

}
