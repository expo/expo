// Copyright 2022-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#pragma once

#include <ABI47_0_0jsi/ABI47_0_0jsi.h>

namespace jsi = ABI47_0_0facebook::jsi;

namespace ABI47_0_0expo {

// Please keep it in-sync with the `ABI47_0_0EXTypedArrayKind` in Objective-C.
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
  TypedArray(TypedArray &&) = default;
  TypedArray &operator=(TypedArray &&) = default;

  TypedArrayKind getKind(jsi::Runtime &runtime) const;

  size_t byteOffset(jsi::Runtime &runtime) const;

  size_t byteLength(jsi::Runtime &runtime) const;

  jsi::ArrayBuffer getBuffer(jsi::Runtime &runtime) const;

  void* getRawPointer(jsi::Runtime &runtime);
};

bool isTypedArray(jsi::Runtime &runtime, const jsi::Object &jsObj);

} // namespace ABI47_0_0expo

#endif // __cplusplus
