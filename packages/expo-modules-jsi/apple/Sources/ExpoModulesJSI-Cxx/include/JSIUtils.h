// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once
#ifdef __cplusplus

#include <TargetConditionals.h>

#include "HostFunctionClosure.h"
#include "CppError.h"
#include "IRuntimeCompat.h"
#include "MemoryBuffer.h"
#include "Public/NativeState.h"
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

#if TARGET_OS_OSX
// react-native-macos (RN 0.81) lacks `jsi::Object::getProperty(Runtime&, const Value&)`,
// so Swift can't look up a property by a JS Value. Provide a `const char*`-keyed wrapper
// to use when iterating own property names.
// TODO: remove when react-native-macos catches up to RN 0.85.
inline jsi::Value getProperty(jsi::IRuntime &runtime, const jsi::Object &object, const char *name) {
  return object.getProperty(runtime, name);
}
#endif

inline jsi::Value valueFromArray(jsi::IRuntime &runtime, const jsi::Array &array) {
  return jsi::Value(runtime, array);
}

inline const jsi::Value valueFromError(jsi::IRuntime &runtime, const jsi::JSError &error) {
  return jsi::Value(runtime, error.value());
}

inline jsi::JSError errorFromValue(jsi::IRuntime &runtime, jsi::Value value) {
  return jsi::JSError(runtime, std::move(value));
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

/**
 Destroys a `jsi::Runtime` created by `createHermesRuntime()`. Since the runtime is imported into
 Swift as an immortal reference type (no ARC-managed lifetime), Swift can't `delete` it directly, so
 the standalone `JavaScriptRuntime` calls this from its `deinit` to free the runtime it owns. Must
 not be called on a runtime owned elsewhere (e.g. the React Native-provided one).
 */
inline void destroyRuntime(jsi::Runtime &runtime) {
  delete &runtime;
}

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

// MARK: - Zero-copy ArrayBuffer borrowing

struct BorrowedBuffer {
  uint8_t *_Nullable data;
  size_t size;
  void *_Nullable retainer;
};

/**
 * Borrows a native-backed ArrayBuffer. The returned data pointer and size are
 * captured at borrow time, so resizable or detached buffers are not supported.
 * A non-null retainer must be passed to releaseBorrowedBuffer exactly once.
 * The {nullptr, 0, nullptr} failure result must not be released.
 */
inline BorrowedBuffer tryBorrowMutableBuffer(
  jsi::IRuntime &runtime, const jsi::ArrayBuffer &arrayBuffer
) {
#if defined(REACT_NATIVE_VERSION_MAJOR) && defined(REACT_NATIVE_VERSION_MINOR) && \
    (REACT_NATIVE_VERSION_MAJOR > 0 || REACT_NATIVE_VERSION_MINOR >= 86)
  auto mutableBuffer = arrayBuffer.tryGetMutableBuffer(runtime);
  if (!mutableBuffer) {
    return {nullptr, 0, nullptr};
  }
  uint8_t *data = mutableBuffer->data();
  size_t size = mutableBuffer->size();
  auto *retained = new std::shared_ptr<jsi::MutableBuffer>(std::move(mutableBuffer));
  return {data, size, retained};
#else
  (void)runtime;
  (void)arrayBuffer;
  return {nullptr, 0, nullptr};
#endif
}

inline void releaseBorrowedBuffer(void *_Nonnull retainer) {
#if defined(REACT_NATIVE_VERSION_MAJOR) && defined(REACT_NATIVE_VERSION_MINOR) && \
    (REACT_NATIVE_VERSION_MAJOR > 0 || REACT_NATIVE_VERSION_MINOR >= 86)
  delete static_cast<std::shared_ptr<jsi::MutableBuffer> *>(retainer);
#else
  (void)retainer;
#endif
}

// MARK: - Native state

inline bool hasNativeState(jsi::IRuntime &runtime, const jsi::Object &object) {
  return object.hasNativeState<expo::NativeState>(runtime);
}

inline void setNativeState(jsi::IRuntime &runtime, const jsi::Object &object, const expo::NativeStateShared &nativeState) {
  object.setNativeState(runtime, nativeState);
}

inline void unsetNativeState(jsi::IRuntime &runtime, const jsi::Object &object) {
  object.setNativeState(runtime, nullptr);
}

/**
 Returns the `expo::NativeState` attached to the object, or `nullptr` if the object
 has no native state, or its native state isn't an `expo::NativeState` subclass.
 Adopted native states (those constructed in external C++ code) are recovered too
 as long as their concrete type derives from `expo::NativeState`.

 Hot path: avoids `Object::hasNativeState<expo::NativeState>` (which internally
 fetches the native state and runs `dynamic_pointer_cast`) followed by another
 `getNativeState<expo::NativeState>`. Instead, do a single bool check via the
 specialized `hasNativeState<jsi::NativeState>`, fetch once, and dynamic-cast inline.
 The pointee survives the temporary shared_ptr's destruction because JSI's slot
 retains it.
 */
inline expo::NativeState *_Nullable getExpoNativeState(jsi::IRuntime &runtime, const jsi::Object &object) {
  if (!object.hasNativeState<jsi::NativeState>(runtime)) {
    return nullptr;
  }
  return dynamic_cast<expo::NativeState *>(
    object.getNativeState<jsi::NativeState>(runtime).get()
  );
}

/**
 Factory used by the default `JavaScriptNativeState` initializer. Builds a fresh
 `expo::NativeState` with the given context/deallocator and returns it wrapped in
 the `expo::NativeStateShared` typedef so Swift can hold it as a single value.
 */
inline expo::NativeStateShared makeExpoNativeStateShared(expo::NativeState::Context context,
                                                         expo::NativeState::ContextDeallocator deallocator) {
  return std::make_shared<expo::NativeState>(context, deallocator);
}

/**
 Builds an `expo::NativeStateWeak` from a strong `expo::NativeStateShared`.
 Exists because Swift/C++ interop does not expose `std::weak_ptr`'s constructor
 directly, so Swift can't write `expo.NativeStateWeak(shared)`.
 */
inline expo::NativeStateWeak makeNativeStateWeak(const expo::NativeStateShared &shared) {
  return expo::NativeStateWeak(shared);
}

/**
 Moves the heap-allocated `expo::NativeStateShared` at `ptr` into a returned
 by-value `NativeStateShared`, then `delete`s the heap allocation. Pairs with
 `new expo::NativeStateShared(...)` performed by no-interop C++ consumers
 (e.g. `EXSharedObjectUtils.mm`) — using Swift's `UnsafeMutablePointer.deallocate()`
 on a pointer obtained from C++ `new` would be an allocator mismatch.
 */
inline expo::NativeStateShared consumeNativeStateSharedPtr(expo::NativeStateShared *ptr) {
  expo::NativeStateShared shared = std::move(*ptr);
  delete ptr;
  return shared;
}

} // namespace expo

#pragma clang assume_nonnull end

#endif // __cplusplus
