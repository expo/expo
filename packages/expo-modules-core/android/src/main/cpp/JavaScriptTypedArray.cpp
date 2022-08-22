#include "JavaScriptTypedArray.h"

#include "JavaScriptRuntime.h"

namespace expo {

JavaScriptTypedArray::JavaScriptTypedArray(
  WeakRuntimeHolder runtime,
  std::shared_ptr<jsi::Object> jsObject
) : jni::HybridClass<JavaScriptTypedArray, JavaScriptObject>(std::move(runtime),
                                                             std::move(jsObject)) {
  jsi::Runtime &jsRuntime = runtimeHolder.getJSRuntime();
  typedArrayWrapper = std::make_shared<expo::TypedArray>(jsRuntime, *get());
  rawPointer = static_cast<char *>(typedArrayWrapper->getRawPointer(jsRuntime));
}

JavaScriptTypedArray::JavaScriptTypedArray(
  std::weak_ptr<JavaScriptRuntime> runtime,
  std::shared_ptr<jsi::Object> jsObject
) : jni::HybridClass<JavaScriptTypedArray, JavaScriptObject>(std::move(runtime),
                                                             std::move(jsObject)) {
  jsi::Runtime &jsRuntime = runtimeHolder.getJSRuntime();
  typedArrayWrapper = std::make_shared<expo::TypedArray>(jsRuntime, *get());
  rawPointer = static_cast<char *>(typedArrayWrapper->getRawPointer(jsRuntime));
}

void JavaScriptTypedArray::registerNatives() {
  registerHybrid({
                   makeNativeMethod("getRawKind", JavaScriptTypedArray::getRawKind),
                   makeNativeMethod("toDirectBuffer", JavaScriptTypedArray::toDirectBuffer),
                   makeNativeMethod("read", JavaScriptTypedArray::readBuffer),
                   makeNativeMethod("write", JavaScriptTypedArray::writeBuffer),

                   makeNativeMethod("readByte", JavaScriptTypedArray::read<int8_t>),
                   makeNativeMethod("read2Byte", JavaScriptTypedArray::read<int16_t>),
                   makeNativeMethod("read4Byte", JavaScriptTypedArray::read<int32_t>),
                   makeNativeMethod("read8Byte", JavaScriptTypedArray::read<int64_t>),
                   makeNativeMethod("readFloat", JavaScriptTypedArray::read<float>),
                   makeNativeMethod("readDouble", JavaScriptTypedArray::read<double>),

                   makeNativeMethod("writeByte", JavaScriptTypedArray::write<int8_t>),
                   makeNativeMethod("write2Byte", JavaScriptTypedArray::write<int16_t>),
                   makeNativeMethod("write4Byte", JavaScriptTypedArray::write<int32_t>),
                   makeNativeMethod("write8Byte", JavaScriptTypedArray::write<int64_t>),
                   makeNativeMethod("writeFloat", JavaScriptTypedArray::write<float>),
                   makeNativeMethod("writeDouble", JavaScriptTypedArray::write<double>),
                 });
}

int JavaScriptTypedArray::getRawKind() {
  jsi::Runtime &jsRuntime = runtimeHolder.getJSRuntime();
  return (int) typedArrayWrapper->getKind(jsRuntime);
}

jni::local_ref<jni::JByteBuffer> JavaScriptTypedArray::toDirectBuffer() {
  jsi::Runtime &jsRuntime = runtimeHolder.getJSRuntime();

  auto byteLength = typedArrayWrapper->byteLength(jsRuntime);
  auto byteOffset = typedArrayWrapper->byteOffset(jsRuntime);

  auto byteBuffer = jni::JByteBuffer::wrapBytes(
    static_cast<uint8_t *>(typedArrayWrapper->getRawPointer(jsRuntime)),
    byteLength - byteOffset
  );

  byteBuffer->order(jni::JByteOrder::nativeOrder());

  return byteBuffer;
}

void JavaScriptTypedArray::readBuffer(
  jni::alias_ref<jni::JArrayByte> buffer,
  int position,
  int size
) {
  buffer->setRegion(
    0,
    size,
    reinterpret_cast<const signed char *>(rawPointer + position)
  );
}

void JavaScriptTypedArray::writeBuffer(
  jni::alias_ref<jni::JArrayByte> buffer,
  int position,
  int size
) {
  auto region = buffer->getRegion(0, size);
  memcpy(rawPointer + position, region.get(), size);
}
}
