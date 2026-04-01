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

class TypedArray : public jsi::Object {
 public:
  TypedArray(jsi::Runtime &, const jsi::Object &);
  TypedArray(TypedArray &&) noexcept = default;
  TypedArray &operator=(TypedArray &&) noexcept = default;

  TypedArrayKind getKind(jsi::Runtime &runtime) const;

  size_t byteOffset(jsi::Runtime &runtime) const;

  size_t byteLength(jsi::Runtime &runtime) const;

  jsi::ArrayBuffer getBuffer(jsi::Runtime &runtime) const;

  void* getRawPointer(jsi::Runtime &runtime) const;
};

bool isTypedArray(jsi::Runtime &runtime, const jsi::Object &jsObj);

} // namespace expo

#endif // __cplusplus
