/*
 * Copyright 2022 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkOpenTypeSVGDecoder_DEFINED
#define SkOpenTypeSVGDecoder_DEFINED

#include "include/core/SkColor.h"
#include "include/core/SkSpan.h"
#include "include/core/SkTypes.h"

#include <memory>

class SkCanvas;

class SkOpenTypeSVGDecoder {
public:
    /** Each instance probably owns an SVG DOM.
     *  The instance may be cached so needs to report how much memory it retains.
     */
    virtual size_t approximateSize() = 0;
    virtual bool render(SkCanvas&, int upem, SkGlyphID glyphId,
                        SkColor foregroundColor, SkSpan<SkColor> palette) = 0;
    virtual ~SkOpenTypeSVGDecoder() = default;
};

#endif  // SkOpenTypeSVGDecoder_DEFINED
