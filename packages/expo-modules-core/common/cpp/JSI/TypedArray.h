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

  /**
   * Returns the typed array's backing ArrayBuffer.
   * Always returns the full buffer, even when the typed array covers only a subset of it.
   */
  jsi::ArrayBuffer getBuffer(jsi::Runtime &runtime) const;

  /**
   * Returns only the portion of the backing buffer spanned by this typed array's view.
   * If the view covers the entire buffer, returns the buffer directly (zero-copy).
   * If the view is a subset, allocates a new ArrayBuffer containing only that slice
   * via ArrayBuffer.prototype.slice() — this involves a data copy.
   */
  jsi::ArrayBuffer getViewedBufferSlice(jsi::Runtime &runtime) const;

  void* getRawPointer(jsi::Runtime &runtime) const;
};

bool isTypedArray(jsi::Runtime &runtime, const jsi::Object &jsObj);

} // namespace expo

#endif // __cplusplus
