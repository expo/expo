#include "JavaScriptArrayBuffer.h"

#include "JavaScriptRuntime.h"
#include "JSIContext.h"

namespace expo {

void JavaScriptArrayBuffer::registerNatives() {
  registerHybrid({
                   makeNativeMethod("size", JavaScriptArrayBuffer::size),
                   makeNativeMethod("readByte", JavaScriptArrayBuffer::read<int8_t>),
                   makeNativeMethod("read2Byte", JavaScriptArrayBuffer::read<int16_t>),
                   makeNativeMethod("read4Byte", JavaScriptArrayBuffer::read<int32_t>),
                   makeNativeMethod("read8Byte", JavaScriptArrayBuffer::read<int64_t>),
                   makeNativeMethod("readFloat", JavaScriptArrayBuffer::read<float>),
                   makeNativeMethod("readDouble", JavaScriptArrayBuffer::read<double>),
                   makeNativeMethod("toDirectBuffer", JavaScriptArrayBuffer::toDirectBuffer),
                 });
}

JavaScriptArrayBuffer::JavaScriptArrayBuffer(
  std::weak_ptr<JavaScriptRuntime> runtime,
  std::shared_ptr<jsi::ArrayBuffer> jsObject
) : runtimeHolder(std::move(runtime)), arrayBuffer(std::move(jsObject)) {
  assert((!runtimeHolder.expired()) && "JS Runtime was used after deallocation");
}

jni::local_ref<JavaScriptArrayBuffer::javaobject> JavaScriptArrayBuffer::newInstance(
  JSIContext *jsiContext,
  std::weak_ptr<JavaScriptRuntime> runtime,
  std::shared_ptr<jsi::ArrayBuffer> jsValue
) {
  auto value = JavaScriptArrayBuffer::newObjectCxxArgs(
    std::move(runtime),
    std::move(jsValue)
  );
  jsiContext->jniDeallocator->addReference(value);
  return value;
}

int JavaScriptArrayBuffer::size() {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();

  return (int) arrayBuffer->size(rawRuntime);
}

uint8_t *JavaScriptArrayBuffer::data() {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();

  return arrayBuffer->data(rawRuntime);
}

jni::local_ref<jni::JByteBuffer> JavaScriptArrayBuffer::toDirectBuffer() {
  auto buffer = jni::JByteBuffer::wrapBytes(data(), size());
  buffer->order(jni::JByteOrder::nativeOrder());
  return buffer;
}

std::shared_ptr<jsi::ArrayBuffer> JavaScriptArrayBuffer::jsiArrayBuffer() {
  return this->arrayBuffer;
}

}
