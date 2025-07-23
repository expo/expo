// Copyright 2025-present 650 Industries. All rights reserved.

#ifdef __cplusplus

namespace expo {

bool isASCIIAndNotNull(const uint8_t c) {
  constexpr uint32_t asciiMask = 0x7f;
  return ((c & static_cast<uint8_t>(~asciiMask)) == 0 && c != 0);
}

inline bool isAllASCIIAndNotNull(const uint8_t * _Nonnull begin, const uint8_t * _Nonnull end) {
  while (begin < end) {
    if (!isASCIIAndNotNull(*begin))
      return false;
    ++begin;
  }
  return true;
}

} // namespace expo

#endif
