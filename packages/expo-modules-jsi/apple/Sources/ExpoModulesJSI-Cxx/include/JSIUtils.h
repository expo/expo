// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once
#ifdef __cplusplus

#include <hermes/hermes.h>

#include "HostFunctionClosure.h"
#include "CppError.h"
#include "IRuntimeCompat.h"
#include "MemoryBuffer.h"
#include "NativeState.h"
#include "TypedArray.h"

namespace jsi = facebook::jsi;

// All pointers in this header are non-null by default. Use `_Nullable` for
// pointers that may legitimately be null (e.g. `getNativeState` return value).
#pragma clang assume_nonnull begin

namespace expo {

/**
 Upcasts a `jsi::Runtime&` to a `jsi::IRuntime&`. RN 0.86 split the JSI API into
 the abstract `IRuntime` base and concrete `Runtime` derived class — most
 value/object/function methods now take `IRuntime&`. Swift's C++ interop does
 not auto-upcast between two `SwiftImportAs: reference` types, so Swift can't
 pass a `Runtime` reference where `IRuntime` is expected without this helper.
 */
inline jsi::IRuntime &iruntime(jsi::Runtime &runtime) noexcept {
  return runtime;
}

inline jsi::Value valueFromFunction(jsi::IRuntime &runtime, const jsi::Function &function) {
  return jsi::Value(runtime, function);
}

// `jsi::Object::setProperty` is a template function that Swift does not support. We need to provide specialized versions.
inline void setProperty(jsi::IRuntime &runtime, const jsi::Object &object, const char *name, const jsi::Value value) {
  object.setProperty(runtime, name, value);
}

inline void setProperty(jsi::IRuntime &runtime, const jsi::Array &array, const char *name, const jsi::Value &value) {
  array.setProperty(runtime, name, value);
}

inline void setValueAtIndex(jsi::IRuntime &runtime, const jsi::Array &array, size_t index, const jsi::Value &value) {
  array.setValueAtIndex(runtime, index, value);
}

inline void setArrayLength(jsi::IRuntime &runtime, const jsi::Array &array, long length) {
  auto oldLength = (int)array.size(runtime);
  auto newLength = (int)length;

  if (newLength != oldLength) {
    array.setProperty(runtime, "length", jsi::Value(newLength));
  }
  if (newLength > oldLength) {
    array.getPropertyAsFunction(runtime, "fill").callWithThis(runtime, array, {
      jsi::Value::undefined(),
      jsi::Value(oldLength),
      jsi::Value(newLength)
    });
  }
}

inline jsi::Value getProperty(jsi::IRuntime &runtime, const jsi::Array &array, const jsi::PropNameID &name) {
  return array.getProperty(runtime, name);
}

inline jsi::Value valueFromArray(jsi::IRuntime &runtime, const jsi::Array &array) {
  return jsi::Value(runtime, array);
}

inline const jsi::Value valueFromError(jsi::IRuntime &runtime, const jsi::JSError &error) {
  return jsi::Value(runtime, error.value());
}

inline std::shared_ptr<const jsi::Buffer> makeSharedStringBuffer(const std::string &source) noexcept {
  return std::make_shared<jsi::StringBuffer>(source);
}

inline jsi::Function createHostFunction(jsi::IRuntime &runtime, const jsi::PropNameID &propName, HostFunctionClosure *closure) {
  auto closurePtr = std::shared_ptr<HostFunctionClosure>(closure);
  return jsi::Function::createFromHostFunction(runtime, propName, 0, [closurePtr](jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *_Nonnull args, size_t count) -> jsi::Value {
    auto result = closurePtr->call(thisValue, args, count);

    // If the Swift closure stored a pending error, rethrow its JSError directly
    // to preserve all properties (message, code, stack, etc.).
    if (auto *error = CppError::getCurrent()) {
      throw error->release();
    }
    return result;
  });
}

inline jsi::Function createHostFunction(jsi::IRuntime &runtime, const char *name, HostFunctionClosure *closure) {
  jsi::PropNameID propName = jsi::PropNameID::forAscii(runtime, name);
  return createHostFunction(runtime, propName, closure);
}

/**
 Returns whether `object` is backed by any `jsi::HostObject` subclass — this includes
 host objects created by `expo::HostObject::makeObject`, by other React Native subsystems,
 and by JS engines themselves. Wraps the templated `jsi::Object::isHostObject<T>` so the
 check is callable from Swift, where C++ function templates cannot be imported directly.
 */
inline bool isHostObject(jsi::IRuntime &runtime, const jsi::Object &object) {
  return object.isHostObject<jsi::HostObject>(runtime);
}

jsi::Runtime* createHermesRuntime();

inline jsi::Value evaluateJavaScript(jsi::IRuntime &runtime, const std::shared_ptr<const jsi::Buffer>& buffer, const std::string& sourceURL) {
  return expo::CppError::tryCatch(runtime, ^{
    return runtime.evaluateJavaScript(buffer, sourceURL);
  });
}

inline jsi::Value callFunction(jsi::IRuntime &runtime, const jsi::Function &function, const jsi::Value *_Nullable args, size_t count) {
  return expo::CppError::tryCatch(runtime, ^{
    return function.call(runtime, args, count);
  });
}

inline jsi::Value callFunctionWithThis(jsi::IRuntime &runtime, const jsi::Function &function, const jsi::Object &jsThis, const jsi::Value *_Nullable args, size_t count) {
  return expo::CppError::tryCatch(runtime, ^{
    return function.callWithThis(runtime, jsThis, args, count);
  });
}

inline jsi::Value callAsConstructor(jsi::IRuntime &runtime, const jsi::Function &function, const jsi::Value *_Nullable args, size_t count) {
  return expo::CppError::tryCatch(runtime, ^{
    return function.callAsConstructor(runtime, args, count);
  });
}

// MARK: - ArrayBuffer

/**
 * Converts a `jsi::ArrayBuffer` to a `jsi::Value`. Needed because Swift/C++ interop
 * does not implicitly upcast `ArrayBuffer` to `Object` for the `Value` constructor.
 */
inline jsi::Value valueFromArrayBuffer(jsi::IRuntime &runtime, const jsi::ArrayBuffer &arrayBuffer) {
  return jsi::Value(runtime, arrayBuffer);
}

/**
 * Returns the size of the array buffer storage in bytes.
 */
inline size_t arrayBufferSize(jsi::IRuntime &runtime, const jsi::ArrayBuffer &arrayBuffer) {
  return arrayBuffer.size(runtime);
}

/**
 * Returns a pointer to the underlying data of the array buffer.
 */
inline uint8_t *arrayBufferData(jsi::IRuntime &runtime, const jsi::ArrayBuffer &arrayBuffer) {
  return arrayBuffer.data(runtime);
}

/**
 * Creates a new array buffer of the given size with zero-initialized memory.
 */
inline jsi::ArrayBuffer createArrayBuffer(jsi::IRuntime &runtime, size_t size) {
  uint8_t *data = new uint8_t[size]();
  auto buffer = std::make_shared<MemoryBuffer>(data, size, [data]() { delete[] data; });
  return jsi::ArrayBuffer(runtime, std::move(buffer));
}

/**
 * Creates a new array buffer that wraps the given native data pointer.
 * The cleanup function is called (with the cleanup context) when the ArrayBuffer is deallocated.
 */
inline jsi::ArrayBuffer createArrayBuffer(
  jsi::IRuntime &runtime,
  uint8_t *data,
  size_t size,
  void *_Nonnull cleanupContext,
  void (* _Nonnull cleanupFunction)(void * _Nonnull)
) {
  // The cleanup context must not be null — the cleanup function is never called without it,
  // which would leak the data. The Swift caller always provides a retained Unmanaged pointer.
  assert(cleanupContext != nullptr && "cleanupContext must not be null; cleanup would be skipped and data leaked");

  auto buffer = std::make_shared<MemoryBuffer>(data, size, [cleanupContext, cleanupFunction]() {
    cleanupFunction(cleanupContext);
  });
  return jsi::ArrayBuffer(runtime, std::move(buffer));
}

// MARK: - Native state

inline bool hasNativeState(jsi::IRuntime &runtime, const jsi::Object &object) {
  return object.hasNativeState<expo::NativeState>(runtime);
}

inline void setNativeState(jsi::IRuntime &runtime, const jsi::Object &object, expo::NativeState &nativeState) {
  std::shared_ptr<expo::NativeState> nativeStatePtr = std::shared_ptr<expo::NativeState>(&nativeState);
  object.setNativeState(runtime, nativeStatePtr);
}

inline void unsetNativeState(jsi::IRuntime &runtime, const jsi::Object &object) {
  object.setNativeState(runtime, nullptr);
}

inline expo::NativeState *_Nullable getNativeState(jsi::IRuntime &runtime, const jsi::Object &object) {
  if (!object.hasNativeState<expo::NativeState>(runtime)) {
    // JSI's implementation asserts if `hasNativeState` returns true, but we prefer to make it nullable.
    return nullptr;
  }
  return object.getNativeState<expo::NativeState>(runtime).get();
}

} // namespace expo

#pragma clang assume_nonnull end

#endif // __cplusplus
