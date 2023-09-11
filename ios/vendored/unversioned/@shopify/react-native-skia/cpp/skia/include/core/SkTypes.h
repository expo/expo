/*
 * Copyright 2006 The Android Open Source Project
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkTypes_DEFINED
#define SkTypes_DEFINED

// All of these files should be independent of things users can set via the user config file.
// They should also be able to be included in any order.
// IWYU pragma: begin_exports
#include "include/private/base/SkFeatures.h"

// Load and verify defines from the user config file.
#include "include/private/base/SkLoadUserConfig.h"

// Any includes or defines below can be configured by the user config file.
#include "include/private/base/SkAPI.h"
#include "include/private/base/SkAssert.h"
#include "include/private/base/SkAttributes.h"
#include "include/private/base/SkDebug.h"
// IWYU pragma: end_exports

#include <climits>
#include <cstdint>

#if defined(SK_GANESH) || defined(SK_GRAPHITE)
#  if !defined(SK_ENABLE_SKSL)
#    define SK_ENABLE_SKSL
#  endif
#else
#  undef SK_GL
#  undef SK_VULKAN
#  undef SK_METAL
#  undef SK_DAWN
#  undef SK_DIRECT3D
#endif

// If SK_R32_SHIFT is set, we'll use that to choose RGBA or BGRA.
// If not, we'll default to RGBA everywhere except BGRA on Windows.
#if defined(SK_R32_SHIFT)
    static_assert(SK_R32_SHIFT == 0 || SK_R32_SHIFT == 16, "");
#elif defined(SK_BUILD_FOR_WIN)
    #define SK_R32_SHIFT 16
#else
    #define SK_R32_SHIFT 0
#endif

#if defined(SK_B32_SHIFT)
    static_assert(SK_B32_SHIFT == (16-SK_R32_SHIFT), "");
#else
    #define SK_B32_SHIFT (16-SK_R32_SHIFT)
#endif

#define SK_G32_SHIFT 8
#define SK_A32_SHIFT 24

/**
 * SK_PMCOLOR_BYTE_ORDER can be used to query the byte order of SkPMColor at compile time.
 */
#ifdef SK_CPU_BENDIAN
#  define SK_PMCOLOR_BYTE_ORDER(C0, C1, C2, C3)     \
        (SK_ ## C3 ## 32_SHIFT == 0  &&             \
         SK_ ## C2 ## 32_SHIFT == 8  &&             \
         SK_ ## C1 ## 32_SHIFT == 16 &&             \
         SK_ ## C0 ## 32_SHIFT == 24)
#else
#  define SK_PMCOLOR_BYTE_ORDER(C0, C1, C2, C3)     \
        (SK_ ## C0 ## 32_SHIFT == 0  &&             \
         SK_ ## C1 ## 32_SHIFT == 8  &&             \
         SK_ ## C2 ## 32_SHIFT == 16 &&             \
         SK_ ## C3 ## 32_SHIFT == 24)
#endif

#if defined SK_DEBUG && defined SK_BUILD_FOR_WIN
    #ifdef free
        #undef free
    #endif
    #include <crtdbg.h>
    #undef free
#endif

#ifndef SK_ALLOW_STATIC_GLOBAL_INITIALIZERS
    #define SK_ALLOW_STATIC_GLOBAL_INITIALIZERS 0
#endif

#if !defined(SK_GAMMA_EXPONENT)
    #define SK_GAMMA_EXPONENT (0.0f)  // SRGB
#endif

#ifndef GR_TEST_UTILS
#  define GR_TEST_UTILS 0
#endif


#if defined(SK_HISTOGRAM_ENUMERATION)  || \
    defined(SK_HISTOGRAM_BOOLEAN)      || \
    defined(SK_HISTOGRAM_EXACT_LINEAR) || \
    defined(SK_HISTOGRAM_MEMORY_KB)
#  define SK_HISTOGRAMS_ENABLED 1
#else
#  define SK_HISTOGRAMS_ENABLED 0
#endif

#ifndef SK_HISTOGRAM_BOOLEAN
#  define SK_HISTOGRAM_BOOLEAN(name, sample)
#endif

#ifndef SK_HISTOGRAM_ENUMERATION
#  define SK_HISTOGRAM_ENUMERATION(name, sample, enum_size)
#endif

#ifndef SK_HISTOGRAM_EXACT_LINEAR
#  define SK_HISTOGRAM_EXACT_LINEAR(name, sample, value_max)
#endif

#ifndef SK_HISTOGRAM_MEMORY_KB
#  define SK_HISTOGRAM_MEMORY_KB(name, sample)
#endif

#define SK_HISTOGRAM_PERCENTAGE(name, percent_as_int) \
    SK_HISTOGRAM_EXACT_LINEAR(name, percent_as_int, 101)

// The top-level define SK_ENABLE_OPTIMIZE_SIZE can be used to remove several large features at once
#if defined(SK_ENABLE_OPTIMIZE_SIZE)
#   define SK_FORCE_RASTER_PIPELINE_BLITTER
#   define SK_DISABLE_SDF_TEXT
#endif

#ifndef SK_DISABLE_LEGACY_SHADERCONTEXT
#   define SK_ENABLE_LEGACY_SHADERCONTEXT
#endif

#if defined(SK_BUILD_FOR_LIBFUZZER) || defined(SK_BUILD_FOR_AFL_FUZZ)
#if !defined(SK_BUILD_FOR_FUZZER)
    #define SK_BUILD_FOR_FUZZER
#endif
#endif

/**
 *  Gr defines are set to 0 or 1, rather than being undefined or defined
 */

#if !defined(GR_CACHE_STATS)
  #if defined(SK_DEBUG) || defined(SK_DUMP_STATS)
      #define GR_CACHE_STATS  1
  #else
      #define GR_CACHE_STATS  0
  #endif
#endif

#if !defined(GR_GPU_STATS)
  #if defined(SK_DEBUG) || defined(SK_DUMP_STATS) || GR_TEST_UTILS
      #define GR_GPU_STATS    1
  #else
      #define GR_GPU_STATS    0
  #endif
#endif

////////////////////////////////////////////////////////////////////////////////

typedef uint32_t SkFourByteTag;
static inline constexpr SkFourByteTag SkSetFourByteTag(char a, char b, char c, char d) {
    return (((uint32_t)a << 24) | ((uint32_t)b << 16) | ((uint32_t)c << 8) | (uint32_t)d);
}

////////////////////////////////////////////////////////////////////////////////

/** 32 bit integer to hold a unicode value
*/
typedef int32_t SkUnichar;

/** 16 bit unsigned integer to hold a glyph index
*/
typedef uint16_t SkGlyphID;

/** 32 bit value to hold a millisecond duration
    Note that SK_MSecMax is about 25 days.
*/
typedef uint32_t SkMSec;

/** Maximum representable milliseconds; 24d 20h 31m 23.647s.
*/
static constexpr SkMSec SK_MSecMax = INT32_MAX;

/** The generation IDs in Skia reserve 0 has an invalid marker.
*/
static constexpr uint32_t SK_InvalidGenID = 0;

/** The unique IDs in Skia reserve 0 has an invalid marker.
*/
static constexpr uint32_t SK_InvalidUniqueID = 0;


#endif
