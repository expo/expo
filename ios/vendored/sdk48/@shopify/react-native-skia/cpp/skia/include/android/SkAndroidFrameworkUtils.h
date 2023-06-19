/*
 * Copyright 2017 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkAndroidFrameworkUtils_DEFINED
#define SkAndroidFrameworkUtils_DEFINED

#include "include/core/SkColor.h"
#include "include/core/SkPoint.h"
#include "include/core/SkRefCnt.h"
#include "include/core/SkTileMode.h"

#ifdef SK_BUILD_FOR_ANDROID_FRAMEWORK

class SkCanvas;
struct SkIRect;
struct SkRect;
class SkSurface;
class SkShader;

/**
 *  SkAndroidFrameworkUtils expose private APIs used only by Android framework.
 */
class SkAndroidFrameworkUtils {
public:

#if defined(SK_GANESH)
    /**
     *  clipWithStencil draws the current clip into a stencil buffer with reference value and mask
     *  set to 0x1. This function works only on a GPU canvas.
     *
     *  @param  canvas A GPU canvas that has a non-empty clip.
     *
     *  @return true on success or false if clip is empty or not a GPU canvas.
     */
    static bool clipWithStencil(SkCanvas* canvas);
#endif //defined(SK_GANESH)

    static void SafetyNetLog(const char*);

    static sk_sp<SkSurface> getSurfaceFromCanvas(SkCanvas* canvas);

    static int SaveBehind(SkCanvas* canvas, const SkRect* subset);

    // Operating within the canvas' clip stack, this resets the geometry of the clip to be wide
    // open modula any device clip restriction that was set outside of the clip stack.
    static void ResetClip(SkCanvas* canvas);

    /**
     * Unrolls a chain of nested SkPaintFilterCanvas to return the base wrapped canvas.
     *
     *  @param  canvas A SkPaintFilterCanvas or any other SkCanvas subclass.
     *
     *  @return SkCanvas that was found in the innermost SkPaintFilterCanvas.
     */
    static SkCanvas* getBaseWrappedCanvas(SkCanvas* canvas);

    /**
     *  If the shader represents a linear gradient ShaderAsALinearGradient
     *  returns true and if info is not null, ShaderAsALinearGradient populates
     *  info with the parameters for the gradient. fColorCount is both an input
     *  and output parameter. On input, it indicates how many entries in
     *  fColors and fColorOffsets can be used, if they are not nullptr. After
     *  asAGradient has run, fColorCount indicates how many color-offset pairs
     *  there are in the gradient. fColorOffsets specifies where on the range of
     *  0 to 1 to transition to the given color. fPoints represent the endpoints
     *  of the gradient.
     */
    struct LinearGradientInfo {
        int         fColorCount    = 0;        //!< In-out parameter, specifies passed size
                                               //   of fColors/fColorOffsets on input, and
                                               //   actual number of colors/offsets on
                                               //   output.
        SkColor*    fColors        = nullptr;  //!< The colors in the gradient.
        SkScalar*   fColorOffsets  = nullptr;  //!< The unit offset for color transitions.
        SkPoint     fPoints[2];                //!< Type specific, see above.
        SkTileMode  fTileMode;
        uint32_t    fGradientFlags = 0;        //!< see SkGradientShader::Flags
    };

    static bool ShaderAsALinearGradient(SkShader* shader, LinearGradientInfo*);
};

#endif // SK_BUILD_FOR_ANDROID_ANDROID

#endif // SkAndroidFrameworkUtils_DEFINED
