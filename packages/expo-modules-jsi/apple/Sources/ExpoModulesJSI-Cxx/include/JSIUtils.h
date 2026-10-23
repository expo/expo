// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <new>
#include <TargetConditionals.h>

// `jsi.h` only forward-declares `jsi::Instrumentation`.
#include <jsi/instrumentation.h>

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

// Clones the function's handle into an object. The intermediate value is a C++ temporary, so its
// rvalue `getObject` moves the handle on instead of cloning it a second time.
inline jsi::Object objectFromFunction(jsi::IRuntime &runtime, const jsi::Function &function) {
  return jsi::Value(runtime, function).getObject(runtime);
}

// `jsi::Object::create` takes the prototype as a value, so the prototype's handle is cloned into one.
inline jsi::Object createObjectWithPrototype(jsi::IRuntime &runtime, const jsi::Object &prototype) {
  return jsi::Object::create(runtime, jsi::Value(runtime, prototype));
}

// `jsi::Object::setProperty` is a template function that Swift does not support. We need to provide specialized versions.
// They take a `jsi::PropNameID` rather than a `const char *`: JSI treats a `const char *` name as ASCII,
// which mangles non-ASCII property names coming from Swift strings.
inline void setProperty(jsi::IRuntime &runtime, const jsi::Object &object, const jsi::PropNameID &name, const jsi::Value &value) {
  object.setProperty(runtime, name, value);
}

inline void setProperty(jsi::IRuntime &runtime, const jsi::Array &array, const jsi::PropNameID &name, const jsi::Value &value) {
  array.setProperty(runtime, name, value);
}

inline void setValueAtIndex(jsi::IRuntime &runtime, const jsi::Array &array, size_t index, const jsi::Value &value) {
  array.setValueAtIndex(runtime, index, value);
}

/**
 Destroys `count` values in place. `jsi::Value::~Value()` is out-of-line in the engine library, so it's
 called only for a value that holds an engine handle.
 */
inline void destroyValues(jsi::Value *_Nonnull values, size_t count) noexcept {
  for (size_t i = 0; i < count; i++) {
    jsi::Value &value = values[i];
    if (!value.isUndefined() && !value.isNull() && !value.isBool() && !value.isNumber()) {
      value.~Value();
    }
  }
}

/**
 Creates an array for `pushValues` to fill with `length` values. React Native 0.86 added `IRuntime::push`,
 so there the array starts empty and grows with each push. On older versions it starts with all `length`
 slots, which `pushValues` sets by index.
 */
inline jsi::Array createArrayForPushing(jsi::IRuntime &runtime, size_t length) {
#if defined(REACT_NATIVE_VERSION_MAJOR) && defined(REACT_NATIVE_VERSION_MINOR) && \
    (REACT_NATIVE_VERSION_MAJOR > 0 || REACT_NATIVE_VERSION_MINOR >= 86)
  (void)length;
  return jsi::Array(runtime, 0);
#else
  return jsi::Array(runtime, length);
#endif
}

/**
 Pushes `count` values to the end of an array from `createArrayForPushing` that already holds `index` values,
 then destroys them, so the memory can take the next values. On React Native 0.86 and later this is one engine
 call.
 */
inline void pushValues(
  jsi::IRuntime &runtime,
  const jsi::Array &array,
  size_t index,
  jsi::Value *_Nonnull values,
  size_t count
) {
#if defined(REACT_NATIVE_VERSION_MAJOR) && defined(REACT_NATIVE_VERSION_MINOR) && \
    (REACT_NATIVE_VERSION_MAJOR > 0 || REACT_NATIVE_VERSION_MINOR >= 86)
  (void)index;
  runtime.push(array, values, count);
#else
  for (size_t i = 0; i < count; i++) {
    array.setValueAtIndex(runtime, index + i, values[i]);
  }
#endif
  destroyValues(values, count);
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

// Move an object's or an array's handle into a new value, without the clone of the copying
// counterparts above. The source is left empty, so it must not be used afterwards.
inline jsi::Value takeValueFromObject(jsi::Object &object) noexcept {
  return jsi::Value(std::move(object));
}

inline jsi::Value takeValueFromArray(jsi::Array &array) noexcept {
  return jsi::Value(std::move(array));
}

// Clones a value's handle into a function or an array buffer. `value.getObject(runtime)` clones the
// handle once, and the rvalue `getFunction` and `getArrayBuffer` move it on. Calling the two steps
// from Swift clones it twice, since Swift only calls the `const&` overloads.
inline jsi::Function functionFromValue(jsi::IRuntime &runtime, const jsi::Value &value) {
  return value.getObject(runtime).getFunction(runtime);
}

inline jsi::ArrayBuffer arrayBufferFromValue(jsi::IRuntime &runtime, const jsi::Value &value) {
  return value.getObject(runtime).getArrayBuffer(runtime);
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
    jsi::Value result;
    // If the Swift closure stored a pending error, rethrow its JSError directly
    // to preserve all properties (message, code, stack, etc.).
    if (closurePtr->call(thisValue, args, count, result)) {
      if (auto *error = CppError::getCurrent()) {
        throw error->release();
      }
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
  return expo::CppError::tryCatch(runtime, [&] {
    return runtime.evaluateJavaScript(buffer, sourceURL);
  });
}

// `jsi::Instrumentation` is not imported into Swift, so reach it from here.
inline void collectGarbage(jsi::IRuntime &runtime, const std::string &cause) {
  runtime.instrumentation().collectGarbage(cause);
}

// MARK: - Result slots

// Construct a host callback's result in place in the engine's result slot. `::new (slot) T(...)` is
// placement new: it runs the constructor on existing memory and allocates nothing. These `jsi::Value`
// constructors are inline, so each helper is two stores, whereas a move-assignment into the slot
// calls `Value::~Value()` and `Value::Value(Value&&)`, both out-of-line in the engine library.
//
// Placement new does not destroy the slot's previous contents, so the slot must hold a value that
// owns nothing; an object or string there would leak its engine handle. Both callers,
// `createHostFunction` and `HostObject::get`, pass a default-constructed slot. The Swift side,
// `JavaScriptValue.write(_:to:)`, picks the helper by kind for a value without a runtime and moves
// any other value's handle into the slot the same way, through `emplaceMovedValue`.
inline void emplaceUndefined(jsi::Value *_Nonnull slot) noexcept {
  ::new (slot) jsi::Value();
}

inline void emplaceNull(jsi::Value *_Nonnull slot) noexcept {
  ::new (slot) jsi::Value(nullptr);
}

inline void emplaceBool(jsi::Value *_Nonnull slot, bool value) noexcept {
  ::new (slot) jsi::Value(value);
}

inline void emplaceNumber(jsi::Value *_Nonnull slot, double value) noexcept {
  ::new (slot) jsi::Value(value);
}

/**
 Moves the value at `source` into the engine's result slot. Placement new, like the `emplace*`
 helpers above: the slot must hold a value that owns nothing. `source` is left holding a null
 pointer, so destroying it afterwards releases nothing.
 */
inline void emplaceMovedValue(jsi::Value *_Nonnull slot, jsi::Value *_Nonnull source) noexcept {
  ::new (slot) jsi::Value(std::move(*source));
}

/**
 Moves the value at `source` into the slot. Placement new, like the helpers above: the slot must hold a
 value that owns nothing. A value without an engine handle (undefined, null, a boolean or a number) is
 copied with the inline constructors, which skips the out-of-line `jsi::Value` move.
 */
inline void emplaceValue(jsi::Value *_Nonnull slot, jsi::Value *_Nonnull source) noexcept {
  if (source->isNumber()) {
    ::new (slot) jsi::Value(source->getNumber());
  } else if (source->isBool()) {
    ::new (slot) jsi::Value(source->getBool());
  } else if (source->isNull()) {
    ::new (slot) jsi::Value(nullptr);
  } else if (source->isUndefined()) {
    ::new (slot) jsi::Value();
  } else {
    ::new (slot) jsi::Value(std::move(*source));
  }
}

/**
 Creates a string value straight from UTF-8 bytes. The `jsi::String` returned by `createFromUtf8`
 is moved into the value, so the engine allocates one handle. Going through `jsi::Value(runtime,
 const jsi::String &)` from Swift instead clones the handle and then releases the original.
 */
inline jsi::Value createStringValueFromUtf8(jsi::IRuntime &runtime, const uint8_t *_Nonnull utf8, size_t length) {
  return jsi::Value(jsi::String::createFromUtf8(runtime, utf8, length));
}

/**
 Same as `createStringValueFromUtf8`, for bytes the caller knows to be ASCII.
 */
inline jsi::Value createStringValueFromAscii(jsi::IRuntime &runtime, const char *_Nonnull ascii, size_t length) {
  return jsi::Value(jsi::String::createFromAscii(runtime, ascii, length));
}

inline jsi::Value callFunction(jsi::IRuntime &runtime, const jsi::Function &function, const jsi::Value *_Nullable args, size_t count) {
  return expo::CppError::tryCatch(runtime, [&] {
    return function.call(runtime, args, count);
  });
}

inline jsi::Value callFunctionWithThis(jsi::IRuntime &runtime, const jsi::Function &function, const jsi::Object &jsThis, const jsi::Value *_Nullable args, size_t count) {
  return expo::CppError::tryCatch(runtime, [&] {
    return function.callWithThis(runtime, jsThis, args, count);
  });
}

/**
 Calls `defineProperty`, the runtime's `Reflect.defineProperty`, on `object` with a new descriptor that holds
 `value` (when `hasValue` is set) and only the attributes that are `true`, like a descriptor built in
 JavaScript. Taking the function and the descriptor keys from the caller lets it create them once per runtime,
 and building the descriptor and the arguments here avoids a round trip through Swift for each of them.
 */
inline void defineProperty(
  jsi::IRuntime &runtime,
  const jsi::Function &defineProperty,
  const jsi::PropNameID &configurableKey,
  const jsi::PropNameID &enumerableKey,
  const jsi::PropNameID &writableKey,
  const jsi::PropNameID &valueKey,
  const jsi::Object &object,
  const uint8_t *_Nonnull nameUtf8,
  size_t nameLength,
  const jsi::Value &value,
  bool hasValue,
  bool writable,
  bool enumerable,
  bool configurable
) {
  expo::CppError::tryCatch(runtime, [&] {
    jsi::Object descriptor(runtime);
    if (configurable) {
      descriptor.setProperty(runtime, configurableKey, true);
    }
    if (enumerable) {
      descriptor.setProperty(runtime, enumerableKey, true);
    }
    if (writable) {
      descriptor.setProperty(runtime, writableKey, true);
    }
    if (hasValue) {
      descriptor.setProperty(runtime, valueKey, value);
    }
    defineProperty.call(runtime, object, jsi::String::createFromUtf8(runtime, nameUtf8, nameLength), descriptor);
    return jsi::Value::undefined();
  });
}

inline jsi::Value callAsConstructor(jsi::IRuntime &runtime, const jsi::Function &function, const jsi::Value *_Nullable args, size_t count) {
  return expo::CppError::tryCatch(runtime, [&] {
    return function.callAsConstructor(runtime, args, count);
  });
}

// MARK: - String

/**
 Invokes `callback` with the engine's internal representation of `string`, chunk by chunk
 (see `jsi::Runtime::getStringData` docs). On RN 0.86+ the method is public on `IRuntime` and is
 called directly. On older versions (e.g. react-native-macos 0.81) it is a protected member of
 `jsi::Runtime`, which Swift cannot call, so this wrapper routes through the public
 `jsi::String::getStringData` template helper instead. That adds one extra indirect call per chunk,
 negligible next to the copy/transcode of the chunk itself.
 The callback's pointer parameters mirror the unannotated `jsi.h` signature, so the same Swift
 function can be passed to either.
 */
inline void getStringData(
  jsi::IRuntime &runtime,
  const jsi::String &string,
  void *ctx,
  void (*callback)(void *_Nullable ctx, bool ascii, const void *_Nullable data, size_t num)
) {
#if defined(REACT_NATIVE_VERSION_MAJOR) && defined(REACT_NATIVE_VERSION_MINOR) && \
    (REACT_NATIVE_VERSION_MAJOR > 0 || REACT_NATIVE_VERSION_MINOR >= 86)
  runtime.getStringData(string, ctx, callback);
#else
  auto forward = [ctx, callback](bool ascii, const void *data, size_t num) {
    callback(ctx, ascii, data, num);
  };
  string.getStringData(runtime, forward);
#endif
}

/**
 Same as `getStringData`, but for a `jsi::PropNameID`.
 */
inline void getPropNameIdData(
  jsi::IRuntime &runtime,
  const jsi::PropNameID &propNameId,
  void *ctx,
  void (*callback)(void *_Nullable ctx, bool ascii, const void *_Nullable data, size_t num)
) {
#if defined(REACT_NATIVE_VERSION_MAJOR) && defined(REACT_NATIVE_VERSION_MINOR) && \
    (REACT_NATIVE_VERSION_MAJOR > 0 || REACT_NATIVE_VERSION_MINOR >= 86)
  runtime.getPropNameIdData(propNameId, ctx, callback);
#else
  auto forward = [ctx, callback](bool ascii, const void *data, size_t num) {
    callback(ctx, ascii, data, num);
  };
  propNameId.getPropNameIdData(runtime, forward);
#endif
}

/**
 Reaches the protected `jsi::Runtime` statics that let a derived class wrap a `PointerValue` in a
 `jsi::Pointer` subclass. Never instantiated: it derives from `jsi::Runtime` only for that access.
 */
class PointerValueAccess : public jsi::Runtime {
 public:
  PointerValueAccess() = delete;

  /**
   A `jsi::String` holding the pointer of the given string value without cloning it. The string
   shares the pointer with `value`, so it must never be destroyed: its destructor would release a
   reference it doesn't own.
   */
  static jsi::String borrowString(const jsi::Value &value) noexcept {
    return make<jsi::String>(const_cast<PointerValue *>(getPointerValue(value)));
  }
} __attribute__((availability(swift, unavailable)));

/**
 Same as `getStringData`, but reads the string straight from a string `jsi::Value`. `value.getString(runtime)`
 clones the handle into a `jsi::String` for the call and releases it after; this lends the value's
 own pointer instead, so the read costs no reference counting.
 */
inline void getStringDataFromValue(
  jsi::IRuntime &runtime,
  const jsi::Value &value,
  void *ctx,
  void (*callback)(void *_Nullable ctx, bool ascii, const void *_Nullable data, size_t num)
) {
  // The borrowed string lives in raw storage that is never destroyed, so it doesn't release the
  // pointer `value` still owns. Nothing else is left behind: a `jsi::String` holds just the pointer.
  alignas(jsi::String) unsigned char storage[sizeof(jsi::String)];
  const jsi::String *string = new (storage) jsi::String(PointerValueAccess::borrowString(value));
  getStringData(runtime, *string, ctx, callback);
}

// MARK: - Memory pressure

/**
 * Sets the external memory pressure of the object. An amount that the runtime rejects is ignored.
 */
inline void setExternalMemoryPressure(jsi::IRuntime &runtime, const jsi::Object &object, size_t amount) noexcept {
  try {
    object.setExternalMemoryPressure(runtime, amount);
  } catch (...) {
    // The pressure is only a hint. Hermes throws for amounts above 32 bits or over its external
    // memory limit, and a C++ exception that reaches Swift terminates the app.
  }
}

/**
 * Sets the external memory pressure of the array buffer. An amount that the runtime rejects is ignored.
 */
inline void setExternalMemoryPressure(jsi::IRuntime &runtime, const jsi::ArrayBuffer &arrayBuffer, size_t amount) noexcept {
  // Swift doesn't convert `jsi::ArrayBuffer` to `jsi::Object` for a C++ parameter.
  setExternalMemoryPressure(runtime, static_cast<const jsi::Object &>(arrayBuffer), amount);
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
 * Creates a new array buffer of the given size. When `initializeToZero` is false, the memory is left
 * uninitialized and the caller must write every byte before JavaScript can read the buffer. When
 * `reportsMemory` is false, the caller must report the memory to the garbage collector itself.
 */
inline jsi::ArrayBuffer createArrayBuffer(jsi::IRuntime &runtime, size_t size, bool initializeToZero, bool reportsMemory) {
  uint8_t *data = initializeToZero ? new uint8_t[size]() : new uint8_t[size];
  auto buffer = std::make_shared<MemoryBuffer>(data, size, [data]() { delete[] data; });
  jsi::ArrayBuffer arrayBuffer(runtime, std::move(buffer));
  // Hermes does not count the memory of a buffer that it did not allocate, so without this
  // pressure the garbage collector does not run for these buffers alone. Only this array buffer
  // owns the memory.
  if (reportsMemory && size > 0) {
    setExternalMemoryPressure(runtime, arrayBuffer, size);
  }
  return arrayBuffer;
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

/**
 Removes the native state from the object. Returns `false` when the engine refuses, for example when the
 object is frozen. A C++ exception can't cross into Swift, so it's caught here.
 */
inline bool unsetNativeState(jsi::IRuntime &runtime, const jsi::Object &object) {
  try {
    object.setNativeState(runtime, nullptr);
    return true;
  } catch (const jsi::JSIException &) {
    return false;
  }
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
