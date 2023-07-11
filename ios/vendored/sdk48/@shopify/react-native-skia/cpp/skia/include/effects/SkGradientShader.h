/*
 * Copyright 2006 The Android Open Source Project
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkGradientShader_DEFINED
#define SkGradientShader_DEFINED

#include "include/core/SkColorSpace.h"
#include "include/core/SkRefCnt.h"
#include "include/core/SkShader.h"
#include "include/core/SkTileMode.h"

/** \class SkGradientShader

    SkGradientShader hosts factories for creating subclasses of SkShader that
    render linear and radial gradients. In general, degenerate cases should not
    produce surprising results, but there are several types of degeneracies:

     * A linear gradient made from the same two points.
     * A radial gradient with a radius of zero.
     * A sweep gradient where the start and end angle are the same.
     * A two point conical gradient where the two centers and the two radii are
       the same.

    For any degenerate gradient with a decal tile mode, it will draw empty since the interpolating
    region is zero area and the outer region is discarded by the decal mode.

    For any degenerate gradient with a repeat or mirror tile mode, it will draw a solid color that
    is the average gradient color, since infinitely many repetitions of the gradients will fill the
    shape.

    For a clamped gradient, every type is well-defined at the limit except for linear gradients. The
    radial gradient with zero radius becomes the last color. The sweep gradient draws the sector
    from 0 to the provided angle with the first color, with a hardstop switching to the last color.
    When the provided angle is 0, this is just the solid last color again. Similarly, the two point
    conical gradient becomes a circle filled with the first color, sized to the provided radius,
    with a hardstop switching to the last color. When the two radii are both zero, this is just the
    solid last color.

    As a linear gradient approaches the degenerate case, its shader will approach the appearance of
    two half planes, each filled by the first and last colors of the gradient. The planes will be
    oriented perpendicular to the vector between the two defining points of the gradient. However,
    once they become the same point, Skia cannot reconstruct what that expected orientation is. To
    provide a stable and predictable color in this case, Skia just uses the last color as a solid
    fill to be similar to many of the other degenerate gradients' behaviors in clamp mode.
*/
class SK_API SkGradientShader {
public:
    enum Flags {
        /** By default gradients will interpolate their colors in unpremul space
         *  and then premultiply each of the results. By setting this flag, the
         *  gradients will premultiply their colors first, and then interpolate
         *  between them.
         *  example: https://fiddle.skia.org/c/@GradientShader_MakeLinear
         */
        kInterpolateColorsInPremul_Flag = 1 << 0,
    };

    struct Interpolation {
        enum class InPremul : bool { kNo = false, kYes = true };

        enum class ColorSpace : uint8_t {
            // Default Skia behavior: interpolate in the color space of the destination surface
            kDestination,

            // https://www.w3.org/TR/css-color-4/#interpolation-space
            kSRGBLinear,
            kLab,
            kOKLab,
            kLCH,
            kOKLCH,
            kSRGB,
            kHSL,
            kHWB,

            kLastColorSpace = kHWB,
        };
        static constexpr int kColorSpaceCount = static_cast<int>(ColorSpace::kLastColorSpace) + 1;

        enum class HueMethod : uint8_t {
            // https://www.w3.org/TR/css-color-4/#hue-interpolation
            kShorter,
            kLonger,
            kIncreasing,
            kDecreasing,

            kLastHueMethod = kDecreasing,
        };
        static constexpr int kHueMethodCount = static_cast<int>(HueMethod::kLastHueMethod) + 1;

        InPremul   fInPremul = InPremul::kNo;
        ColorSpace fColorSpace = ColorSpace::kDestination;
        HueMethod  fHueMethod  = HueMethod::kShorter;  // Only relevant for LCH, OKLCH, HSL, or HWB

        static Interpolation FromFlags(uint32_t flags) {
            return {flags & kInterpolateColorsInPremul_Flag ? InPremul::kYes : InPremul::kNo,
                    ColorSpace::kDestination,
                    HueMethod::kShorter};
        }
    };

    /** Returns a shader that generates a linear gradient between the two specified points.
        <p />
        @param  pts     The start and end points for the gradient.
        @param  colors  The array[count] of colors, to be distributed between the two points
        @param  pos     May be NULL. array[count] of SkScalars, or NULL, of the relative position of
                        each corresponding color in the colors array. If this is NULL,
                        the the colors are distributed evenly between the start and end point.
                        If this is not null, the values must lie between 0.0 and 1.0, and be
                        strictly increasing. If the first value is not 0.0, then an additional
                        color stop is added at position 0.0, with the same color as colors[0].
                        If the the last value is not 1.0, then an additional color stop is added
                        at position 1.0, with the same color as colors[count - 1].
        @param  count   Must be >=2. The number of colors (and pos if not NULL) entries.
        @param  mode    The tiling mode

        example: https://fiddle.skia.org/c/@GradientShader_MakeLinear
    */
    static sk_sp<SkShader> MakeLinear(const SkPoint pts[2],
                                      const SkColor colors[], const SkScalar pos[], int count,
                                      SkTileMode mode,
                                      uint32_t flags = 0, const SkMatrix* localMatrix = nullptr);

    /** Returns a shader that generates a linear gradient between the two specified points.
        <p />
        @param  pts     The start and end points for the gradient.
        @param  colors  The array[count] of colors, to be distributed between the two points
        @param  pos     May be NULL. array[count] of SkScalars, or NULL, of the relative position of
                        each corresponding color in the colors array. If this is NULL,
                        the the colors are distributed evenly between the start and end point.
                        If this is not null, the values must lie between 0.0 and 1.0, and be
                        strictly increasing. If the first value is not 0.0, then an additional
                        color stop is added at position 0.0, with the same color as colors[0].
                        If the the last value is not 1.0, then an additional color stop is added
                        at position 1.0, with the same color as colors[count - 1].
        @param  count   Must be >=2. The number of colors (and pos if not NULL) entries.
        @param  mode    The tiling mode

        example: https://fiddle.skia.org/c/@GradientShader_MakeLinear
    */
    static sk_sp<SkShader> MakeLinear(const SkPoint pts[2],
                                      const SkColor4f colors[], sk_sp<SkColorSpace> colorSpace,
                                      const SkScalar pos[], int count, SkTileMode mode,
                                      const Interpolation& interpolation,
                                      const SkMatrix* localMatrix);
    static sk_sp<SkShader> MakeLinear(const SkPoint pts[2],
                                      const SkColor4f colors[], sk_sp<SkColorSpace> colorSpace,
                                      const SkScalar pos[], int count, SkTileMode mode,
                                      uint32_t flags = 0, const SkMatrix* localMatrix = nullptr) {
        return MakeLinear(pts, colors, std::move(colorSpace), pos, count, mode,
                          Interpolation::FromFlags(flags), localMatrix);
    }

    /** Returns a shader that generates a radial gradient given the center and radius.
        <p />
        @param  center  The center of the circle for this gradient
        @param  radius  Must be positive. The radius of the circle for this gradient
        @param  colors  The array[count] of colors, to be distributed between the center and edge of the circle
        @param  pos     May be NULL. The array[count] of SkScalars, or NULL, of the relative position of
                        each corresponding color in the colors array. If this is NULL,
                        the the colors are distributed evenly between the center and edge of the circle.
                        If this is not null, the values must lie between 0.0 and 1.0, and be
                        strictly increasing. If the first value is not 0.0, then an additional
                        color stop is added at position 0.0, with the same color as colors[0].
                        If the the last value is not 1.0, then an additional color stop is added
                        at position 1.0, with the same color as colors[count - 1].
        @param  count   Must be >= 2. The number of colors (and pos if not NULL) entries
        @param  mode    The tiling mode
    */
    static sk_sp<SkShader> MakeRadial(const SkPoint& center, SkScalar radius,
                                      const SkColor colors[], const SkScalar pos[], int count,
                                      SkTileMode mode,
                                      uint32_t flags = 0, const SkMatrix* localMatrix = nullptr);

    /** Returns a shader that generates a radial gradient given the center and radius.
        <p />
        @param  center  The center of the circle for this gradient
        @param  radius  Must be positive. The radius of the circle for this gradient
        @param  colors  The array[count] of colors, to be distributed between the center and edge of the circle
        @param  pos     May be NULL. The array[count] of SkScalars, or NULL, of the relative position of
                        each corresponding color in the colors array. If this is NULL,
                        the the colors are distributed evenly between the center and edge of the circle.
                        If this is not null, the values must lie between 0.0 and 1.0, and be
                        strictly increasing. If the first value is not 0.0, then an additional
                        color stop is added at position 0.0, with the same color as colors[0].
                        If the the last value is not 1.0, then an additional color stop is added
                        at position 1.0, with the same color as colors[count - 1].
        @param  count   Must be >= 2. The number of colors (and pos if not NULL) entries
        @param  mode    The tiling mode
    */
    static sk_sp<SkShader> MakeRadial(const SkPoint& center, SkScalar radius,
                                      const SkColor4f colors[], sk_sp<SkColorSpace> colorSpace,
                                      const SkScalar pos[], int count, SkTileMode mode,
                                      const Interpolation& interpolation,
                                      const SkMatrix* localMatrix);
    static sk_sp<SkShader> MakeRadial(const SkPoint& center, SkScalar radius,
                                      const SkColor4f colors[], sk_sp<SkColorSpace> colorSpace,
                                      const SkScalar pos[], int count, SkTileMode mode,
                                      uint32_t flags = 0, const SkMatrix* localMatrix = nullptr) {
        return MakeRadial(center, radius, colors, std::move(colorSpace), pos, count, mode,
                          Interpolation::FromFlags(flags), localMatrix);
    }

    /**
     *  Returns a shader that generates a conical gradient given two circles, or
     *  returns NULL if the inputs are invalid. The gradient interprets the
     *  two circles according to the following HTML spec.
     *  http://dev.w3.org/html5/2dcontext/#dom-context-2d-createradialgradient
     */
    static sk_sp<SkShader> MakeTwoPointConical(const SkPoint& start, SkScalar startRadius,
                                               const SkPoint& end, SkScalar endRadius,
                                               const SkColor colors[], const SkScalar pos[],
                                               int count, SkTileMode mode,
                                               uint32_t flags = 0,
                                               const SkMatrix* localMatrix = nullptr);

    /**
     *  Returns a shader that generates a conical gradient given two circles, or
     *  returns NULL if the inputs are invalid. The gradient interprets the
     *  two circles according to the following HTML spec.
     *  http://dev.w3.org/html5/2dcontext/#dom-context-2d-createradialgradient
     */
    static sk_sp<SkShader> MakeTwoPointConical(const SkPoint& start, SkScalar startRadius,
                                               const SkPoint& end, SkScalar endRadius,
                                               const SkColor4f colors[],
                                               sk_sp<SkColorSpace> colorSpace, const SkScalar pos[],
                                               int count, SkTileMode mode,
                                               const Interpolation& interpolation,
                                               const SkMatrix* localMatrix);
    static sk_sp<SkShader> MakeTwoPointConical(const SkPoint& start, SkScalar startRadius,
                                               const SkPoint& end, SkScalar endRadius,
                                               const SkColor4f colors[],
                                               sk_sp<SkColorSpace> colorSpace, const SkScalar pos[],
                                               int count, SkTileMode mode,
                                               uint32_t flags = 0,
                                               const SkMatrix* localMatrix = nullptr) {
        return MakeTwoPointConical(start, startRadius, end, endRadius, colors,
                                   std::move(colorSpace), pos, count, mode,
                                   Interpolation::FromFlags(flags), localMatrix);
    }

    /** Returns a shader that generates a sweep gradient given a center.

        The shader accepts negative angles and angles larger than 360, draws
        between 0 and 360 degrees, similar to the CSS conic-gradient
        semantics. 0 degrees means horizontal positive x axis. The start angle
        must be less than the end angle, otherwise a null pointer is
        returned. If color stops do not contain 0 and 1 but are within this
        range, the respective outer color stop is repeated for 0 and 1. Color
        stops less than 0 are clamped to 0, and greater than 1 are clamped to 1.
        <p />
        @param  cx         The X coordinate of the center of the sweep
        @param  cx         The Y coordinate of the center of the sweep
        @param  colors     The array[count] of colors, to be distributed around the center, within
                           the gradient angle range.
        @param  pos        May be NULL. The array[count] of SkScalars, or NULL, of the relative
                           position of each corresponding color in the colors array. If this is
                           NULL, then the colors are distributed evenly within the angular range.
                           If this is not null, the values must lie between 0.0 and 1.0, and be
                           strictly increasing. If the first value is not 0.0, then an additional
                           color stop is added at position 0.0, with the same color as colors[0].
                           If the the last value is not 1.0, then an additional color stop is added
                           at position 1.0, with the same color as colors[count - 1].
        @param  count      Must be >= 2. The number of colors (and pos if not NULL) entries
        @param  mode       Tiling mode: controls drawing outside of the gradient angular range.
        @param  startAngle Start of the angular range, corresponding to pos == 0.
        @param  endAngle   End of the angular range, corresponding to pos == 1.
    */
    static sk_sp<SkShader> MakeSweep(SkScalar cx, SkScalar cy,
                                     const SkColor colors[], const SkScalar pos[], int count,
                                     SkTileMode mode,
                                     SkScalar startAngle, SkScalar endAngle,
                                     uint32_t flags, const SkMatrix* localMatrix);
    static sk_sp<SkShader> MakeSweep(SkScalar cx, SkScalar cy,
                                     const SkColor colors[], const SkScalar pos[], int count,
                                     uint32_t flags = 0, const SkMatrix* localMatrix = nullptr) {
        return MakeSweep(cx, cy, colors, pos, count, SkTileMode::kClamp, 0, 360, flags,
                         localMatrix);
    }

    /** Returns a shader that generates a sweep gradient given a center.

        The shader accepts negative angles and angles larger than 360, draws
        between 0 and 360 degrees, similar to the CSS conic-gradient
        semantics. 0 degrees means horizontal positive x axis. The start angle
        must be less than the end angle, otherwise a null pointer is
        returned. If color stops do not contain 0 and 1 but are within this
        range, the respective outer color stop is repeated for 0 and 1. Color
        stops less than 0 are clamped to 0, and greater than 1 are clamped to 1.
        <p />
        @param  cx         The X coordinate of the center of the sweep
        @param  cx         The Y coordinate of the center of the sweep
        @param  colors     The array[count] of colors, to be distributed around the center, within
                           the gradient angle range.
        @param  pos        May be NULL. The array[count] of SkScalars, or NULL, of the relative
                           position of each corresponding color in the colors array. If this is
                           NULL, then the colors are distributed evenly within the angular range.
                           If this is not null, the values must lie between 0.0 and 1.0, and be
                           strictly increasing. If the first value is not 0.0, then an additional
                           color stop is added at position 0.0, with the same color as colors[0].
                           If the the last value is not 1.0, then an additional color stop is added
                           at position 1.0, with the same color as colors[count - 1].
        @param  count      Must be >= 2. The number of colors (and pos if not NULL) entries
        @param  mode       Tiling mode: controls drawing outside of the gradient angular range.
        @param  startAngle Start of the angular range, corresponding to pos == 0.
        @param  endAngle   End of the angular range, corresponding to pos == 1.
    */
    static sk_sp<SkShader> MakeSweep(SkScalar cx, SkScalar cy,
                                     const SkColor4f colors[], sk_sp<SkColorSpace> colorSpace,
                                     const SkScalar pos[], int count,
                                     SkTileMode mode,
                                     SkScalar startAngle, SkScalar endAngle,
                                     const Interpolation& interpolation,
                                     const SkMatrix* localMatrix);
    static sk_sp<SkShader> MakeSweep(SkScalar cx, SkScalar cy,
                                     const SkColor4f colors[], sk_sp<SkColorSpace> colorSpace,
                                     const SkScalar pos[], int count,
                                     SkTileMode mode,
                                     SkScalar startAngle, SkScalar endAngle,
                                     uint32_t flags, const SkMatrix* localMatrix) {
        return MakeSweep(cx, cy, colors, std::move(colorSpace), pos, count, mode, startAngle,
                         endAngle, Interpolation::FromFlags(flags), localMatrix);
    }
    static sk_sp<SkShader> MakeSweep(SkScalar cx, SkScalar cy,
                                     const SkColor4f colors[], sk_sp<SkColorSpace> colorSpace,
                                     const SkScalar pos[], int count,
                                     uint32_t flags = 0, const SkMatrix* localMatrix = nullptr) {
        return MakeSweep(cx, cy, colors, std::move(colorSpace), pos, count, SkTileMode::kClamp,
                         0, 360, flags, localMatrix);
    }
};

#endif
