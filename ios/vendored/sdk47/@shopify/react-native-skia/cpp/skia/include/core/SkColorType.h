/*
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkColorType_DEFINED
#define SkColorType_DEFINED

#include "include/core/SkTypes.h"

/** \enum SkColorType
    Describes how pixel bits encode color. A pixel may be an alpha mask, a grayscale, RGB, or ARGB.

    kN32_SkColorType selects the native 32-bit ARGB format for the current configuration. This can
    lead to inconsistent results across platforms, so use with caution.
*/
enum SkColorType : int {
    kUnknown_SkColorType,      //!< uninitialized
    kAlpha_8_SkColorType,      //!< pixel with alpha in 8-bit byte
    kRGB_565_SkColorType,      //!< pixel with 5 bits red, 6 bits green, 5 bits blue, in 16-bit word
    kARGB_4444_SkColorType,    //!< pixel with 4 bits for alpha, red, green, blue; in 16-bit word
    kRGBA_8888_SkColorType,    //!< pixel with 8 bits for red, green, blue, alpha; in 32-bit word
    kRGB_888x_SkColorType,     //!< pixel with 8 bits each for red, green, blue; in 32-bit word
    kBGRA_8888_SkColorType,    //!< pixel with 8 bits for blue, green, red, alpha; in 32-bit word
    kRGBA_1010102_SkColorType, //!< 10 bits for red, green, blue; 2 bits for alpha; in 32-bit word
    kBGRA_1010102_SkColorType, //!< 10 bits for blue, green, red; 2 bits for alpha; in 32-bit word
    kRGB_101010x_SkColorType,  //!< pixel with 10 bits each for red, green, blue; in 32-bit word
    kBGR_101010x_SkColorType,  //!< pixel with 10 bits each for blue, green, red; in 32-bit word
    kBGR_101010x_XR_SkColorType, //!< pixel with 10 bits each for blue, green, red; in 32-bit word, extended range
    kGray_8_SkColorType,       //!< pixel with grayscale level in 8-bit byte
    kRGBA_F16Norm_SkColorType, //!< pixel with half floats in [0,1] for red, green, blue, alpha;
                               //   in 64-bit word
    kRGBA_F16_SkColorType,     //!< pixel with half floats for red, green, blue, alpha;
                               //   in 64-bit word
    kRGBA_F32_SkColorType,     //!< pixel using C float for red, green, blue, alpha; in 128-bit word

    // The following 6 colortypes are just for reading from - not for rendering to
    kR8G8_unorm_SkColorType,         //!< pixel with a uint8_t for red and green

    kA16_float_SkColorType,          //!< pixel with a half float for alpha
    kR16G16_float_SkColorType,       //!< pixel with a half float for red and green

    kA16_unorm_SkColorType,          //!< pixel with a little endian uint16_t for alpha
    kR16G16_unorm_SkColorType,       //!< pixel with a little endian uint16_t for red and green
    kR16G16B16A16_unorm_SkColorType, //!< pixel with a little endian uint16_t for red, green, blue
                                     //   and alpha

    kSRGBA_8888_SkColorType,
    kR8_unorm_SkColorType,

    kLastEnum_SkColorType     = kR8_unorm_SkColorType, //!< last valid value

#if SK_PMCOLOR_BYTE_ORDER(B,G,R,A)
    kN32_SkColorType          = kBGRA_8888_SkColorType,//!< native 32-bit BGRA encoding

#elif SK_PMCOLOR_BYTE_ORDER(R,G,B,A)
    kN32_SkColorType          = kRGBA_8888_SkColorType,//!< native 32-bit RGBA encoding

#else
    #error "SK_*32_SHIFT values must correspond to BGRA or RGBA byte order"
#endif
};
static constexpr int kSkColorTypeCnt = static_cast<int>(kLastEnum_SkColorType) + 1;

#endif
