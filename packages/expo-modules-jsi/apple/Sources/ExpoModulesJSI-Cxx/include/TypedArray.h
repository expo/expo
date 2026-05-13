// Copyright 2022-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#pragma once

#include <jsi/jsi.h>

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

bool isTypedArray(jsi::Runtime &runtime, const jsi::Object &jsObj);

/**
 * Returns the `TypedArrayKind` of the given typed-array object, derived from its
 * `constructor.name` (e.g. `Uint8Array`, `Float32Array`).
 */
TypedArrayKind getTypedArrayKind(jsi::Runtime &runtime, const jsi::Object &jsObj);

/**
 * Returns the underlying `ArrayBuffer` backing the given typed-array object.
 * Throws if the object has no attached ArrayBuffer.
 */
jsi::ArrayBuffer getTypedArrayBuffer(jsi::Runtime &runtime, const jsi::Object &jsObj);

} // namespace expo

#endif // __cplusplus
