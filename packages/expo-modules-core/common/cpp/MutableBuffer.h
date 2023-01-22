// Copyright 2023-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#pragma once

#include <jsi/jsi.h>

namespace jsi = facebook::jsi;

namespace expo {

typedef std::function<void(void)> MutableBufferDeallocator;

class MutableBuffer : public jsi::MutableBuffer {

public:
  MutableBuffer(uint8_t *data, size_t size, MutableBufferDeallocator deallocator);
  ~MutableBuffer();
  size_t size() const;
  uint8_t* data();

private:
  uint8_t *data_;
  size_t size_;
  MutableBufferDeallocator deallocator;

}; // class MutableBuffer

} // namespace expo

#endif // __cplusplus
