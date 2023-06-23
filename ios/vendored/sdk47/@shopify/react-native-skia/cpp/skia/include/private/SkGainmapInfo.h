/*
 * Copyright 2023 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkGainmapInfo_DEFINED
#define SkGainmapInfo_DEFINED

#include "include/core/SkColor.h"

/**
 *  Gainmap rendering parameters. Suppose our display has HDR to SDR ratio of H and we wish to
 *  display an image with gainmap on this display. Let B be the pixel value from the base image
 *  in a color space that has the primaries of the base image and a linear transfer function. Let
 *  G be the pixel value from the gainmap. Let D be the output pixel in the same color space as B.
 *  The value of D is computed as follows:
 *
 *  First, let W be a weight parameter determing how much the gainmap will be applied.
 *    W = clamp((log(H)                - log(fDisplayRatioSdr)) /
 *              (log(fDisplayRatioHdr) - log(fDisplayRatioSdr), 0, 1)
 *
 *  Next, let L be the gainmap value in log space. We compute this from the value G that was
 *  sampled from the texture as follows:
 *    L = mix(log(fGainmapRatioMin), log(fGainmapRatioMax), pow(G, fGainmapGamma))
 *
 *  Finally, apply the gainmap to compute D, the displayed pixel. If the base image is SDR then
 *  compute:
 *    D = (B + fEpsilonSdr) * exp(L * W) - fEpsilonHdr
 *  If the base image is HDR then compute:
 *    D = (B + fEpsilonHdr) * exp(L * (W - 1)) - fEpsilonSdr
 *
 *  In the above math, log() is a natural logarithm and exp() is natural exponentiation. Note,
 *  however, that the base used for the log() and exp() functions does not affect the results of
 *  the computation (it cancels out, as long as the same base is used throughout).
 */
struct SkGainmapInfo {
    /**
     *  Parameters for converting the gainmap from its image encoding to log space. These are
     *  specified per color channel. The alpha value is unused.
     */
    SkColor4f fGainmapRatioMin = {1.f, 1.f, 1.f, 1.0};
    SkColor4f fGainmapRatioMax = {2.f, 2.f, 2.f, 1.0};
    SkColor4f fGainmapGamma = {1.f, 1.f, 1.f, 1.f};

    /**
     *  Parameters sometimes used in gainmap computation to avoid numerical instability.
     */
    SkColor4f fEpsilonSdr = {0.f, 0.f, 0.f, 1.0};
    SkColor4f fEpsilonHdr = {0.f, 0.f, 0.f, 1.0};

    /**
     *  If the output display's HDR to SDR ratio is less or equal than fDisplayRatioSdr then the SDR
     *  rendition is displayed. If the output display's HDR to SDR ratio is greater or equal than
     *  fDisplayRatioHdr then the HDR rendition is displayed. If the output display's HDR to SDR
     *  ratio is between these values then an interpolation between the two is displayed using the
     *  math above.
     */
    float fDisplayRatioSdr = 1.f;
    float fDisplayRatioHdr = 2.f;

    /**
     *  Whether the base image is the SDR image or the HDR image.
     */
    enum class BaseImageType {
        kSDR,
        kHDR,
    };
    BaseImageType fBaseImageType = BaseImageType::kSDR;

    inline bool operator==(const SkGainmapInfo& other) {
        return fGainmapRatioMin == other.fGainmapRatioMin &&
               fGainmapRatioMax == other.fGainmapRatioMax && fGainmapGamma == other.fGainmapGamma &&
               fEpsilonSdr == other.fEpsilonSdr && fEpsilonHdr == other.fEpsilonHdr &&
               fDisplayRatioSdr == other.fDisplayRatioSdr &&
               fDisplayRatioHdr == other.fDisplayRatioHdr && fBaseImageType == other.fBaseImageType;
    }
    inline bool operator!=(const SkGainmapInfo& other) { return !(*this == other); }

    // TODO(ccameron): Remove these parameters once we are certain they are not used in Android.
    enum class Type {
        kUnknown,
        kMultiPicture,
        kJpegR_Linear,
        kJpegR_HLG,
        kJpegR_PQ,
        kHDRGM,
    };
    SkColor4f fLogRatioMin = {0.f, 0.f, 0.f, 1.0};
    SkColor4f fLogRatioMax = {1.f, 1.f, 1.f, 1.0};
    float fHdrRatioMin = 1.f;
    float fHdrRatioMax = 50.f;
    Type fType = Type::kUnknown;
};

#endif
