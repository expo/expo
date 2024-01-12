/*
 * Copyright 2006 The Android Open Source Project
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkFloatingPoint_DEFINED
#define SkFloatingPoint_DEFINED

#include "include/private/base/SkAttributes.h"
#include "include/private/base/SkFloatBits.h"
#include "include/private/base/SkMath.h"

#include <cmath>
#include <cstdint>
#include <cstring>
#include <limits>

inline constexpr float SK_FloatSqrt2 = 1.41421356f;
inline constexpr float SK_FloatPI    = 3.14159265f;
inline constexpr double SK_DoublePI  = 3.14159265358979323846264338327950288;

static inline float sk_float_sqrt(float x) { return std::sqrt(x); }
static inline float sk_float_sin(float x) { return std::sin(x); }
static inline float sk_float_cos(float x) { return std::cos(x); }
static inline float sk_float_tan(float x) { return std::tan(x); }
static inline float sk_float_floor(float x) { return std::floor(x); }
static inline float sk_float_ceil(float x) { return std::ceil(x); }
static inline float sk_float_trunc(float x) { return std::trunc(x); }
static inline float sk_float_acos(float x) { return std::acos(x); }
static inline float sk_float_asin(float x) { return std::asin(x); }
static inline float sk_float_atan2(float y, float x) { return std::atan2(y,x); }
static inline float sk_float_abs(float x) { return std::fabs(x); }
static inline float sk_float_copysign(float x, float y) { return std::copysign(x, y); }
static inline float sk_float_mod(float x, float y) { return std::fmod(x,y); }
static inline float sk_float_pow(float x, float y) { return std::pow(x, y); }
static inline float sk_float_exp(float x) { return std::exp(x); }
static inline float sk_float_log(float x) { return std::log(x); }
static inline float sk_float_log2(float x) { return std::log2(x); }

static constexpr int sk_float_sgn(float x) {
    return (0.0f < x) - (x < 0.0f);
}

static constexpr float sk_float_degrees_to_radians(float degrees) {
    return degrees * (SK_FloatPI / 180);
}

static constexpr float sk_float_radians_to_degrees(float radians) {
    return radians * (180 / SK_FloatPI);
}

// floor(double+0.5) vs. floorf(float+0.5f) give comparable performance, but upcasting to double
// means tricky values like 0.49999997 and 2^24 get rounded correctly. If these were rounded
// as floatf(x + .5f), they would be 1 higher than expected.
#define sk_float_round(x) (float)sk_double_round((double)(x))

static inline bool sk_float_isfinite(float x) {
    return SkFloatBits_IsFinite(SkFloat2Bits(x));
}

static inline bool sk_floats_are_finite(float a, float b) {
    return sk_float_isfinite(a) && sk_float_isfinite(b);
}

static inline bool sk_floats_are_finite(const float array[], int count) {
    float prod = 0;
    for (int i = 0; i < count; ++i) {
        prod *= array[i];
    }
    // At this point, prod will either be NaN or 0
    return prod == 0;   // if prod is NaN, this check will return false
}

static inline bool sk_float_isinf(float x) {
    return SkFloatBits_IsInf(SkFloat2Bits(x));
}

static constexpr bool sk_float_isnan(float x) { return x != x; }
static constexpr bool sk_double_isnan(double x) { return x != x; }

inline constexpr int SK_MaxS32FitsInFloat = 2147483520;
inline constexpr int SK_MinS32FitsInFloat = -SK_MaxS32FitsInFloat;

// 0x7fffff8000000000
inline constexpr int64_t SK_MaxS64FitsInFloat = SK_MaxS64 >> (63-24) << (63-24);
inline constexpr int64_t SK_MinS64FitsInFloat = -SK_MaxS64FitsInFloat;

/**
 *  Return the closest int for the given float. Returns SK_MaxS32FitsInFloat for NaN.
 */
static constexpr int sk_float_saturate2int(float x) {
    x = x < SK_MaxS32FitsInFloat ? x : SK_MaxS32FitsInFloat;
    x = x > SK_MinS32FitsInFloat ? x : SK_MinS32FitsInFloat;
    return (int)x;
}

/**
 *  Return the closest int for the given double. Returns SK_MaxS32 for NaN.
 */
static constexpr int sk_double_saturate2int(double x) {
    x = x < SK_MaxS32 ? x : SK_MaxS32;
    x = x > SK_MinS32 ? x : SK_MinS32;
    return (int)x;
}

/**
 *  Return the closest int64_t for the given float. Returns SK_MaxS64FitsInFloat for NaN.
 */
static constexpr int64_t sk_float_saturate2int64(float x) {
    x = x < SK_MaxS64FitsInFloat ? x : SK_MaxS64FitsInFloat;
    x = x > SK_MinS64FitsInFloat ? x : SK_MinS64FitsInFloat;
    return (int64_t)x;
}

#define sk_float_floor2int(x)   sk_float_saturate2int(sk_float_floor(x))
#define sk_float_round2int(x)   sk_float_saturate2int(sk_float_round(x))
#define sk_float_ceil2int(x)    sk_float_saturate2int(sk_float_ceil(x))

#define sk_float_floor2int_no_saturate(x)   (int)sk_float_floor(x)
#define sk_float_round2int_no_saturate(x)   (int)sk_float_round(x)
#define sk_float_ceil2int_no_saturate(x)    (int)sk_float_ceil(x)

#define sk_double_floor(x)          floor(x)
#define sk_double_round(x)          floor((x) + 0.5)
#define sk_double_ceil(x)           ceil(x)
#define sk_double_floor2int(x)      (int)sk_double_floor(x)
#define sk_double_round2int(x)      (int)sk_double_round(x)
#define sk_double_ceil2int(x)       (int)sk_double_ceil(x)

// Cast double to float, ignoring any warning about too-large finite values being cast to float.
// Clang thinks this is undefined, but it's actually implementation defined to return either
// the largest float or infinity (one of the two bracketing representable floats).  Good enough!
SK_NO_SANITIZE("float-cast-overflow")
static constexpr float sk_double_to_float(double x) {
    return static_cast<float>(x);
}

inline constexpr float SK_FloatNaN = std::numeric_limits<float>::quiet_NaN();
inline constexpr float SK_FloatInfinity = std::numeric_limits<float>::infinity();
inline constexpr float SK_FloatNegativeInfinity = -SK_FloatInfinity;

inline constexpr double SK_DoubleNaN = std::numeric_limits<double>::quiet_NaN();

// Calculate the midpoint between a and b. Similar to std::midpoint in c++20.
static constexpr float sk_float_midpoint(float a, float b) {
    // Use double math to avoid underflow and overflow.
    return static_cast<float>(0.5 * (static_cast<double>(a) + b));
}

// Returns false if any of the floats are outside the range [0...1].
// Returns true if count is 0.
bool sk_floats_are_unit(const float array[], size_t count);

static inline float sk_float_rsqrt_portable(float x) { return 1.0f / sk_float_sqrt(x); }
static inline float sk_float_rsqrt         (float x) { return 1.0f / sk_float_sqrt(x); }

// The number of significant digits to print.
inline constexpr int SK_FLT_DECIMAL_DIG = std::numeric_limits<float>::max_digits10;

// IEEE defines how float divide behaves for non-finite values and zero-denoms, but C does not,
// so we have a helper that suppresses the possible undefined-behavior warnings.
SK_NO_SANITIZE("float-divide-by-zero")
static constexpr float sk_ieee_float_divide(float numer, float denom) {
    return numer / denom;
}

SK_NO_SANITIZE("float-divide-by-zero")
static constexpr double sk_ieee_double_divide(double numer, double denom) {
    return numer / denom;
}

// Return a*b + c.
static inline float sk_fmaf(float a, float b, float c) {
    return std::fma(a, b, c);
}

// Returns true iff the provided number is within a small epsilon of 0.
bool sk_double_nearly_zero(double a);

// Compare two doubles and return true if they are within maxUlpsDiff of each other.
// * nan as a or b - returns false.
// * infinity, infinity or -infinity, -infinity - returns true.
// * infinity and any other number - returns false.
//
// ulp is an initialism for Units in the Last Place.
bool sk_doubles_nearly_equal_ulps(double a, double b, uint8_t maxUlpsDiff=16);

#endif
