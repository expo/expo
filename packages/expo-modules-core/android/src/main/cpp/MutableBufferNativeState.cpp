#include "MutableBufferNativeState.h"

namespace expo {

MutableBufferNativeState::MutableBufferNativeState(std::shared_ptr<jsi::MutableBuffer> buffer)
  : buffer(std::move(buffer)) {}

jsi::ArrayBuffer createNativeBackedArrayBuffer(
  jsi::Runtime &runtime,
  std::shared_ptr<jsi::MutableBuffer> buffer
) {
  auto arrayBuffer = runtime.createArrayBuffer(buffer);
  arrayBuffer.setNativeState(runtime, std::make_shared<MutableBufferNativeState>(std::move(buffer)));
  return arrayBuffer;
}

std::shared_ptr<jsi::MutableBuffer> tryGetMutableBuffer(
  jsi::Runtime &runtime,
  const jsi::ArrayBuffer &arrayBuffer
) {
  if (auto buffer = arrayBuffer.tryGetMutableBuffer(runtime)) {
    return buffer;
  }

  if (!arrayBuffer.hasNativeState<MutableBufferNativeState>(runtime)) {
    return nullptr;
  }

  auto buffer = arrayBuffer.getNativeState<MutableBufferNativeState>(runtime)->buffer;
  if (!buffer || arrayBuffer.data(runtime) != buffer->data()) {
    return nullptr;
  }
  return buffer;
}

} // namespace expo
