/*
 * Copyright 2023 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkGainmapShader_DEFINED
#define SkGainmapShader_DEFINED

#include "include/core/SkRefCnt.h"
#include "include/private/base/SkAPI.h"

class SkColorSpace;
class SkShader;
class SkImage;
struct SkGainmapInfo;
struct SkRect;
struct SkSamplingOptions;

/**
 *  A gainmap shader will apply a gainmap to an base image using the math described alongside the
 *  definition of SkGainmapInfo.
 */
class SK_API SkGainmapShader {
public:
    /**
     *  Make a gainmap shader.
     *
     *  When sampling the base image baseImage, the rectangle baseRect will be sampled to map to
     *  the rectangle dstRect. Sampling will be done according to baseSamplingOptions.
     *
     *  When sampling the gainmap image gainmapImage, the rectangle gainmapRect will be sampled to
     *  map to the rectangle dstRect. Sampling will be done according to gainmapSamplingOptions.
     *
     *  The gainmap will be applied according to the HDR to SDR ratio specified in dstHdrRatio.
     *
     *  This shader must know the color space of the canvas that it will be rendered to. This color
     *  space must be specified in dstColorSpace.
     *  TODO(ccameron): Remove the need for dstColorSpace.
     */
    static sk_sp<SkShader> Make(const sk_sp<const SkImage>& baseImage,
                                const SkRect& baseRect,
                                const SkSamplingOptions& baseSamplingOptions,
                                const sk_sp<const SkImage>& gainmapImage,
                                const SkRect& gainmapRect,
                                const SkSamplingOptions& gainmapSamplingOptions,
                                const SkGainmapInfo& gainmapInfo,
                                const SkRect& dstRect,
                                float dstHdrRatio,
                                sk_sp<SkColorSpace> dstColorSpace);
};

#endif
