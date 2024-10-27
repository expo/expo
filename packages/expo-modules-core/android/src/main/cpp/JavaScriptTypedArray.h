#pragma once

#include "TypedArray.h"
#include "JavaScriptObject.h"
#include "WeakRuntimeHolder.h"

#include <fbjni/fbjni.h>
#include <fbjni/ByteBuffer.h>
#include <jsi/jsi.h>

#include <memory>

namespace expo {

class JavaScriptRuntime;

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

class JavaScriptTypedArray : public jni::HybridClass<JavaScriptTypedArray, JavaScriptObject> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/JavaScriptTypedArray;";
  static auto constexpr TAG = "JavaScriptTypedArray";

  static void registerNatives();

  static jni::local_ref<JavaScriptTypedArray::javaobject> newInstance(
    JSIContext *jSIContext,
    std::weak_ptr<JavaScriptRuntime> runtime,
    std::shared_ptr<jsi::Object> jsObject
  );

  JavaScriptTypedArray(
    std::weak_ptr<JavaScriptRuntime> runtime,
    std::shared_ptr<jsi::Object> jsObject
  );

  JavaScriptTypedArray(
    WeakRuntimeHolder runtime,
    std::shared_ptr<jsi::Object> jsObject
  );

  /**
   * Gets a raw kind of the underlying typed array.
   */
  int getRawKind();

  /**
   * Converts typed array into a direct byte buffer.
   */
  jni::local_ref<jni::JByteBuffer> toDirectBuffer();

private:
  std::shared_ptr<expo::TypedArray> typedArrayWrapper;

  /**
   * Cached pointer to the beginning of the byte buffer.
   */
  char *rawPointer;

  void readBuffer(jni::alias_ref<jni::JArrayByte> buffer, int position, int size);

  void writeBuffer(jni::alias_ref<jni::JArrayByte> buffer, int position, int size);

  template<class T>
  T read(int position) {
    return *reinterpret_cast<T *>(rawPointer + position);
  }

  template<class T>
  void write(int position, T value) {
    *reinterpret_cast<T *>(rawPointer + position) = value;
  }
};
} // namespace expo
