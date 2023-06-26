/*
 * Copyright 2022 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGOpenTypeSVGDecoder_DEFINED
#define SkSVGOpenTypeSVGDecoder_DEFINED

#include "include/core/SkColor.h"
#include "include/core/SkOpenTypeSVGDecoder.h"
#include "include/core/SkSpan.h"
#include "include/core/SkTypes.h"

class SkCanvas;
class SkSVGDOM;

class SkSVGOpenTypeSVGDecoder : public SkOpenTypeSVGDecoder {
public:
    static std::unique_ptr<SkOpenTypeSVGDecoder> Make(const uint8_t* svg, size_t svgLength);
    size_t approximateSize() override;
    bool render(SkCanvas&, int upem, SkGlyphID glyphId,
                SkColor foregroundColor, SkSpan<SkColor> palette) override;
    ~SkSVGOpenTypeSVGDecoder() override;
private:
    SkSVGOpenTypeSVGDecoder(sk_sp<SkSVGDOM> skSvg, size_t approximateSize);
    sk_sp<SkSVGDOM> fSkSvg;
    size_t fApproximateSize;
};

#endif  // SkSVGOpenTypeSVGDecoder_DEFINED
