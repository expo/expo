// Copyright 2023-present 650 Industries. All rights reserved.

#include "MutableBuffer.h"

namespace expo {

MutableBuffer::MutableBuffer(uint8_t *data, size_t size, MutableBufferDeallocator deallocator) : data_(data), size_(size), deallocator(deallocator) {}

MutableBuffer::~MutableBuffer() {
  deallocator();
}

uint8_t *MutableBuffer::data() {
  return data_;
}

size_t MutableBuffer::size() const {
  return size_;
}

} // namespace expo
