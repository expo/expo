#ifdef __cplusplus

#pragma once

#include <functional>
#include <jsi/jsi.h>

namespace jsi = facebook::jsi;

namespace expo {

using CleanupFunc = std::function<void()>;

/**
 * A JSI-compatible memory buffer that allows creating JSI ArrayBuffers from natively-managed memory.
 * Since ArrayBuffers created from native memory don't automatically deallocate during GC,
 * this class handles deallocation through a custom cleanup function.
 */
class MemoryBuffer final : public jsi::MutableBuffer {
public:
  MemoryBuffer(uint8_t* data, size_t size, CleanupFunc&& cleanupFunc);
  ~MemoryBuffer() override;

  uint8_t* data() override;
  [[nodiscard]] size_t size() const override;

private:
  uint8_t* data_;
  size_t size_;
  CleanupFunc cleanupFunc;
};

}

#endif
