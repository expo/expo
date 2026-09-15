#pragma once

#include "ExpoHeader.pch"

namespace expo {

namespace jsi = facebook::jsi;

/**
 * Native state attached to every native-backed `jsi::ArrayBuffer` created by Expo.
 * It retains the `jsi::MutableBuffer` that owns the bytes, so the buffer can be recovered
 * later with `expo::tryGetMutableBuffer` even when the runtime doesn't implement
 * `jsi::Runtime::tryGetMutableBuffer`. Hermes V1 returns `nullptr` from that method,
 * which would otherwise force a copy and break the zero-copy contract.
 */
class MutableBufferNativeState final : public jsi::NativeState {
public:
  explicit MutableBufferNativeState(std::shared_ptr<jsi::MutableBuffer> buffer);

  std::shared_ptr<jsi::MutableBuffer> buffer;
};

/**
 * Creates a JS `ArrayBuffer` that shares the bytes of `buffer` and tags it with
 * `MutableBufferNativeState`, so `expo::tryGetMutableBuffer` can find the buffer again.
 */
jsi::ArrayBuffer createNativeBackedArrayBuffer(
  jsi::Runtime &runtime,
  std::shared_ptr<jsi::MutableBuffer> buffer
);

/**
 * Returns the `jsi::MutableBuffer` backing `arrayBuffer`, or `nullptr` when the bytes live
 * on the JS heap. Asks the runtime first and falls back to the native state attached by
 * `createNativeBackedArrayBuffer`. The fallback is used only when the JS object still points
 * at the retained buffer's memory, so a detached or re-attached `ArrayBuffer` is never shared.
 */
std::shared_ptr<jsi::MutableBuffer> tryGetMutableBuffer(
  jsi::Runtime &runtime,
  const jsi::ArrayBuffer &arrayBuffer
);

} // namespace expo
