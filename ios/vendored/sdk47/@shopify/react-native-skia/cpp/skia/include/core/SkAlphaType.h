/*
 * Copyright 2022 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkAlphaType_DEFINED
#define SkAlphaType_DEFINED

/** \enum SkAlphaType
    Describes how to interpret the alpha component of a pixel. A pixel may
    be opaque, or alpha, describing multiple levels of transparency.

    In simple blending, alpha weights the draw color and the destination
    color to create a new color. If alpha describes a weight from zero to one:

    new color = draw color * alpha + destination color * (1 - alpha)

    In practice alpha is encoded in two or more bits, where 1.0 equals all bits set.

    RGB may have alpha included in each component value; the stored
    value is the original RGB multiplied by alpha. Premultiplied color
    components improve performance.
*/
enum SkAlphaType : int {
    kUnknown_SkAlphaType,                          //!< uninitialized
    kOpaque_SkAlphaType,                           //!< pixel is opaque
    kPremul_SkAlphaType,                           //!< pixel components are premultiplied by alpha
    kUnpremul_SkAlphaType,                         //!< pixel components are independent of alpha
    kLastEnum_SkAlphaType = kUnpremul_SkAlphaType, //!< last valid value
};

/** Returns true if SkAlphaType equals kOpaque_SkAlphaType.

    kOpaque_SkAlphaType is a hint that the SkColorType is opaque, or that all
    alpha values are set to their 1.0 equivalent. If SkAlphaType is
    kOpaque_SkAlphaType, and SkColorType is not opaque, then the result of
    drawing any pixel with a alpha value less than 1.0 is undefined.
*/
static inline bool SkAlphaTypeIsOpaque(SkAlphaType at) {
    return kOpaque_SkAlphaType == at;
}

#endif
