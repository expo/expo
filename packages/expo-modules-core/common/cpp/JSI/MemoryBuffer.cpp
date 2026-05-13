#include "MemoryBuffer.h"

namespace expo {

using namespace facebook;

MemoryBuffer::MemoryBuffer(uint8_t* data, size_t size, CleanupFunc&& cleanupFunc)
  : data_(data), size_(size), cleanupFunc(std::move(cleanupFunc)) {}

MemoryBuffer::~MemoryBuffer() {
  if (cleanupFunc != nullptr) {
    cleanupFunc();
  }
}

uint8_t* MemoryBuffer::data() {
  return data_;
}

size_t MemoryBuffer::size() const {
  return size_;
}

}
