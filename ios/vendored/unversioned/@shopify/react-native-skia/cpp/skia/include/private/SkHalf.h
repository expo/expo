/*
 * Copyright 2014 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkHalf_DEFINED
#define SkHalf_DEFINED

#include "include/core/SkTypes.h"
#include "include/private/SkVx.h"

// 16-bit floating point value
// format is 1 bit sign, 5 bits exponent, 10 bits mantissa
// only used for storage
typedef uint16_t SkHalf;

static constexpr uint16_t SK_HalfMin     = 0x0400; // 2^-14  (minimum positive normal value)
static constexpr uint16_t SK_HalfMax     = 0x7bff; // 65504
static constexpr uint16_t SK_HalfEpsilon = 0x1400; // 2^-10
static constexpr uint16_t SK_Half1       = 0x3C00; // 1

// convert between half and single precision floating point
float SkHalfToFloat(SkHalf h);
SkHalf SkFloatToHalf(float f);

// Convert between half and single precision floating point,
// assuming inputs and outputs are both finite, and may
// flush values which would be denormal half floats to zero.
static inline skvx::float4 SkHalfToFloat_finite_ftz(uint64_t rgba) {
    return skvx::from_half(skvx::half4::Load(&rgba));
}
static inline skvx::half4 SkFloatToHalf_finite_ftz(const skvx::float4& c) {
    return skvx::to_half(c);
}

#endif
