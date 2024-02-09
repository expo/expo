/*
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkAlign_DEFINED
#define SkAlign_DEFINED

#include "include/private/base/SkAssert.h"

#include <cstddef>

template <typename T> static constexpr T SkAlign2(T x) { return (x + 1) >> 1 << 1; }
template <typename T> static constexpr T SkAlign4(T x) { return (x + 3) >> 2 << 2; }
template <typename T> static constexpr T SkAlign8(T x) { return (x + 7) >> 3 << 3; }

template <typename T> static constexpr bool SkIsAlign2(T x) { return 0 == (x & 1); }
template <typename T> static constexpr bool SkIsAlign4(T x) { return 0 == (x & 3); }
template <typename T> static constexpr bool SkIsAlign8(T x) { return 0 == (x & 7); }

template <typename T> static constexpr T SkAlignPtr(T x) {
    return sizeof(void*) == 8 ? SkAlign8(x) : SkAlign4(x);
}
template <typename T> static constexpr bool SkIsAlignPtr(T x) {
    return sizeof(void*) == 8 ? SkIsAlign8(x) : SkIsAlign4(x);
}

/**
 *  align up to a power of 2
 */
static inline constexpr size_t SkAlignTo(size_t x, size_t alignment) {
    // The same as alignment && SkIsPow2(value), w/o a dependency cycle.
    SkASSERT(alignment && (alignment & (alignment - 1)) == 0);
    return (x + alignment - 1) & ~(alignment - 1);
}

#endif
