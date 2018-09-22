/*
 * Copyright 2016 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#ifdef _WIN32
#include <assert.h>
#include <intrin.h>
#include <folly/Portability.h>

FOLLY_ALWAYS_INLINE int __builtin_clz(unsigned int x) {
  unsigned long index;
  return (int)(_BitScanReverse(&index, (unsigned long)x) ? 31 - index : 32);
}

FOLLY_ALWAYS_INLINE int __builtin_clzl(unsigned long x) {
  return __builtin_clz((unsigned int)x);
}

FOLLY_ALWAYS_INLINE int __builtin_clzll(unsigned long long x) {
  unsigned long index;
  return (int)(_BitScanReverse64(&index, x) ? 63 - index : 64);
}

FOLLY_ALWAYS_INLINE int __builtin_ctzll(unsigned long long x) {
  unsigned long index;
  return (int)(_BitScanForward64(&index, x) ? index : 64);
}

FOLLY_ALWAYS_INLINE int __builtin_ffs(int x) {
  unsigned long index;
  return (int)(_BitScanForward(&index, (unsigned long)x) ? index + 1 : 0);
}

FOLLY_ALWAYS_INLINE int __builtin_ffsl(long x) { return __builtin_ffs((int)x); }

FOLLY_ALWAYS_INLINE int __builtin_ffsll(long long x) {
  unsigned long index;
  return (int)(_BitScanForward64(&index, (unsigned long long)x) ? index + 1 : 0);
}

FOLLY_ALWAYS_INLINE int __builtin_popcountll(unsigned long long x) {
  return (int)__popcnt64(x);
}

FOLLY_ALWAYS_INLINE void* __builtin_return_address(unsigned int frame) {
  // I really hope frame is zero...
  assert(frame == 0);
  return _ReturnAddress();
}
#endif
