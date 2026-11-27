// Copyright 2022-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#pragma once

#include <cstdlib>

#include "IRuntimeCompat.h"

namespace jsi = facebook::jsi;

namespace expo {

// Please keep it in-sync with the `EXTypedArrayKind` in Objective-C.
// We need to maintain two implementations to expose this enum to Swift.
enum class TypedArrayKind {
  Unknown = 0,
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

// Returns whether the JSI headers provide the RN 0.86+ `IRuntime` TypedArray predicates and accessors.
inline bool hasNativeTypedArraySupport() noexcept {
  return EXPO_JSI_HAS_RN_086 != 0;
}

bool isTypedArray(jsi::IRuntime &runtime, const jsi::Object &jsObj) noexcept;

inline bool isUint8Array([[maybe_unused]] jsi::IRuntime &runtime, [[maybe_unused]] const jsi::Object &jsObj) noexcept {
#if EXPO_JSI_HAS_RN_086
  try {
    return runtime.isUint8Array(jsObj);
  } catch (const jsi::JSIException &) {
    return false;
  }
#else
  std::abort();
#endif
}

/**
 * Returns the `TypedArrayKind` of `jsObj` by invoking the intrinsic
 * `TypedArray.prototype[Symbol.toStringTag]` getter with `jsObj` as `this`. Returns
 * `TypedArrayKind::Unknown` for non-typed-array objects (including `DataView`, proxies, and
 * prototype-forged objects) or unsupported kinds, without running user code or throwing.
 */
TypedArrayKind getTypedArrayKind(
  jsi::IRuntime &runtime,
  const jsi::Object &jsObj,
  const jsi::Function &toStringTagGetter
) noexcept;

struct TypedArrayProperties {
  size_t byteLength;
  size_t byteOffset;
  size_t length;
};

/**
 * Reads `byteLength`, `byteOffset`, and `length` by invoking the intrinsic `TypedArray.prototype`
 * getters so own properties on the JS object cannot shadow the internal slots.
 */
TypedArrayProperties getFallbackTypedArrayProperties(
  jsi::IRuntime &runtime,
  const jsi::Object &jsObj,
  const jsi::Function &byteLengthGetter,
  const jsi::Function &byteOffsetGetter,
  const jsi::Function &lengthGetter
);

/**
 * Returns the backing `ArrayBuffer` by invoking the intrinsic `TypedArray.prototype.buffer` getter.
 */
jsi::ArrayBuffer getFallbackTypedArrayBuffer(
  jsi::IRuntime &runtime,
  const jsi::Object &jsObj,
  const jsi::Function &bufferGetter
);

} // namespace expo

#endif // __cplusplus
