// Copyright 2022-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#pragma once

#include "IRuntimeCompat.h"

namespace jsi = facebook::jsi;

namespace expo {

// Please keep it in-sync with the `EXTypedArrayKind` in Objective-C.
// We need to maintain two implementations to expose this enum to Swift.
enum class TypedArrayKind {
  Int8Array = 1,
  Int16Array = 2,
  Int32Array = 3,
  Uint8Array = 4,
  Uint8ClampedArray = 5,
  Uint16Array = 6,
  Uint32Array = 7,
  Float32Array = 8,
  Float64Array = 9,
  BigInt64Array = 10,
  BigUint64Array = 11,
};

// Returns whether the JSI runtime supports native TypedArray predicates and accessors (RN 0.86+).
inline bool hasNativeTypedArraySupport() noexcept {
  return EXPO_JSI_HAS_RN_086 != 0;
}

bool isTypedArray(jsi::IRuntime &runtime, const jsi::Object &jsObj);

inline bool isUint8Array(jsi::IRuntime &runtime, const jsi::Object &jsObj) {
#if EXPO_JSI_HAS_RN_086
  return runtime.isUint8Array(jsObj);
#else
  (void)runtime;
  (void)jsObj;
  return false;
#endif
}

/**
 * Returns the `TypedArrayKind` of the given typed-array object, derived from its
 * `constructor.name` (e.g. `Uint8Array`, `Float32Array`). The property names are passed in,
 * so callers can create them once per runtime.
 */
TypedArrayKind getTypedArrayKind(
  jsi::IRuntime &runtime,
  const jsi::Object &jsObj,
  const jsi::PropNameID &constructorPropName,
  const jsi::PropNameID &namePropName
);

/**
 * Returns the underlying `ArrayBuffer` backing the given typed-array object.
 * Throws if the object has no attached ArrayBuffer.
 */
jsi::ArrayBuffer getTypedArrayBuffer(
  jsi::IRuntime &runtime,
  const jsi::Object &jsObj,
  const jsi::PropNameID &bufferPropName
);

struct TypedArrayProperties {
  size_t byteLength;
  size_t byteOffset;
  size_t length;
};

/**
 * Reads `byteLength`, `byteOffset`, and `length` from a TypedArray object using JSI's native
 * RN 0.86+ `IRuntime` TypedArray accessors (no JS property lookups). Only call when
 * `hasNativeTypedArraySupport()` is `true`.
 */
TypedArrayProperties getNativeTypedArrayProperties(
  jsi::IRuntime &runtime,
  const jsi::Object &jsObj
);

/**
 * Returns the backing `ArrayBuffer` of a TypedArray using JSI's native RN 0.86+ accessor.
 * Only call when `hasNativeTypedArraySupport()` is `true`.
 */
jsi::ArrayBuffer getNativeTypedArrayBuffer(
  jsi::IRuntime &runtime,
  const jsi::Object &jsObj
);

} // namespace expo

#endif // __cplusplus
