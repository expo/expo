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
                 });
}

JavaScriptArrayBuffer::JavaScriptArrayBuffer(
  std::weak_ptr<JavaScriptRuntime> runtime,
  std::shared_ptr<jsi::ArrayBuffer> jsObject
) : runtimeHolder(std::move(runtime)), arrayBuffer(std::move(jsObject)) {
  runtimeHolder.ensureRuntimeIsValid();
}

JavaScriptArrayBuffer::JavaScriptArrayBuffer(
  WeakRuntimeHolder runtime,
  std::shared_ptr<jsi::ArrayBuffer> jsObject
) : runtimeHolder(std::move(runtime)), arrayBuffer(std::move(jsObject)) {
  runtimeHolder.ensureRuntimeIsValid();
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
  jsi::Runtime &jsRuntime = runtimeHolder.getJSRuntime();
  return (int) arrayBuffer->size(jsRuntime);
}

}
