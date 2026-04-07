// Copyright 2025-present 650 Industries. All rights reserved.

#pragma once
#ifdef __cplusplus

#include <functional>
#include <jsi/jsi.h>

namespace expo {

using CleanupFunc = std::function<void()>;

/**
 * A JSI-compatible mutable buffer that allows creating JSI ArrayBuffers from natively-managed memory.
 * Since ArrayBuffers created from native memory don't automatically deallocate during GC,
 * this class handles deallocation through a custom cleanup function.
 */
class MemoryBuffer final : public facebook::jsi::MutableBuffer {
public:
  MemoryBuffer(uint8_t *data, size_t size, CleanupFunc &&cleanupFunc)
    : data_(data), size_(size), cleanupFunc_(std::move(cleanupFunc)) {}

  // Non-copyable and non-movable to prevent double-free of the underlying data.
  MemoryBuffer(const MemoryBuffer &) = delete;
  MemoryBuffer &operator=(const MemoryBuffer &) = delete;
  MemoryBuffer(MemoryBuffer &&) = delete;
  MemoryBuffer &operator=(MemoryBuffer &&) = delete;

  ~MemoryBuffer() override {
    if (cleanupFunc_ != nullptr) {
      cleanupFunc_();
    }
  }

  uint8_t *data() override {
    return data_;
  }

  [[nodiscard]] size_t size() const override {
    return size_;
  }

private:
  uint8_t *data_;
  size_t size_;
  CleanupFunc cleanupFunc_;
};

} // namespace expo

#endif // __cplusplus
