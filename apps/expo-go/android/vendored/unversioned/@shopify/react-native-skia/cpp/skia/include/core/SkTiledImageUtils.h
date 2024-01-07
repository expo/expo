/*
 * Copyright 2023 Google LLC
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkTiledImageUtils_DEFINED
#define SkTiledImageUtils_DEFINED

#include "include/core/SkCanvas.h"
#include "include/core/SkImage.h"
#include "include/core/SkRect.h"
#include "include/core/SkRefCnt.h"
#include "include/core/SkSamplingOptions.h"
#include "include/core/SkScalar.h"
#include "include/private/base/SkAPI.h"

#include <cstdint>

class SkPaint;

/** \namespace SkTiledImageUtils
    SkTiledImageUtils' DrawImage/DrawImageRect methods are intended to be direct replacements
    for their SkCanvas equivalents. The SkTiledImageUtils calls will break SkBitmap-backed
    SkImages into smaller tiles and draw them if the original image is too large to be
    uploaded to the GPU. If the original image doesn't need tiling or is already gpu-backed
    the DrawImage/DrawImageRect calls will fall through to the matching SkCanvas call.
*/
namespace SkTiledImageUtils {

SK_API void DrawImageRect(SkCanvas* canvas,
                          const SkImage* image,
                          const SkRect& src,
                          const SkRect& dst,
                          const SkSamplingOptions& sampling = {},
                          const SkPaint* paint = nullptr,
                          SkCanvas::SrcRectConstraint constraint =
                                  SkCanvas::kFast_SrcRectConstraint);

inline void DrawImageRect(SkCanvas* canvas,
                          const sk_sp<SkImage>& image,
                          const SkRect& src,
                          const SkRect& dst,
                          const SkSamplingOptions& sampling = {},
                          const SkPaint* paint = nullptr,
                          SkCanvas::SrcRectConstraint constraint =
                                  SkCanvas::kFast_SrcRectConstraint) {
    DrawImageRect(canvas, image.get(), src, dst, sampling, paint, constraint);
}

inline void DrawImageRect(SkCanvas* canvas,
                          const SkImage* image,
                          const SkRect& dst,
                          const SkSamplingOptions& sampling = {},
                          const SkPaint* paint = nullptr,
                          SkCanvas::SrcRectConstraint constraint =
                                  SkCanvas::kFast_SrcRectConstraint) {
    if (!image) {
        return;
    }

    SkRect src = SkRect::MakeIWH(image->width(), image->height());

    DrawImageRect(canvas, image, src, dst, sampling, paint, constraint);
}

inline void DrawImageRect(SkCanvas* canvas,
                          const sk_sp<SkImage>& image,
                          const SkRect& dst,
                          const SkSamplingOptions& sampling = {},
                          const SkPaint* paint = nullptr,
                          SkCanvas::SrcRectConstraint constraint =
                                  SkCanvas::kFast_SrcRectConstraint) {
    DrawImageRect(canvas, image.get(), dst, sampling, paint, constraint);
}

inline void DrawImage(SkCanvas* canvas,
                      const SkImage* image,
                      SkScalar x, SkScalar y,
                      const SkSamplingOptions& sampling = {},
                      const SkPaint* paint = nullptr,
                      SkCanvas::SrcRectConstraint constraint =
                              SkCanvas::kFast_SrcRectConstraint) {
    if (!image) {
        return;
    }

    SkRect src = SkRect::MakeIWH(image->width(), image->height());
    SkRect dst = SkRect::MakeXYWH(x, y, image->width(), image->height());

    DrawImageRect(canvas, image, src, dst, sampling, paint, constraint);
}

inline void DrawImage(SkCanvas* canvas,
                      const sk_sp<SkImage>& image,
                      SkScalar x, SkScalar y,
                      const SkSamplingOptions& sampling = {},
                      const SkPaint* paint = nullptr,
                      SkCanvas::SrcRectConstraint constraint =
                              SkCanvas::kFast_SrcRectConstraint) {
    DrawImage(canvas, image.get(), x, y, sampling, paint, constraint);
}

static constexpr int kNumImageKeyValues = 6;

/** Retrieves a set of values that can be used as part of a cache key for the provided image.

    Unfortunately, SkImage::uniqueID isn't sufficient as an SkImage cache key. In particular,
    SkBitmap-backed SkImages can share a single SkBitmap and refer to different subsets of it.
    In this situation the optimal key is based on the SkBitmap's generation ID and the subset
    rectangle.
    For Picture-backed images this method will attempt to generate a concise internally-based
    key (i.e., containing picture ID, matrix translation, width and height, etc.). For complicated
    Picture-backed images (i.e., those w/ a paint or a full matrix) it will fall back to
    using 'image's unique key.

    @param image     The image for which key values are desired
    @param keyValues The resulting key values
*/
SK_API void GetImageKeyValues(const SkImage* image, uint32_t keyValues[kNumImageKeyValues]);

}  // namespace SkTiledImageUtils

#endif // SkTiledImageUtils_DEFINED
