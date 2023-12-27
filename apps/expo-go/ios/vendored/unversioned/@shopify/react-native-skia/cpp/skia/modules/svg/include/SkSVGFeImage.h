/*
 * Copyright 2021 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGFeImage_DEFINED
#define SkSVGFeImage_DEFINED

#include "modules/svg/include/SkSVGFe.h"
#include "modules/svg/include/SkSVGTypes.h"

class SK_API SkSVGFeImage : public SkSVGFe {
public:
    static sk_sp<SkSVGFeImage> Make() { return sk_sp<SkSVGFeImage>(new SkSVGFeImage()); }

    SVG_ATTR(Href               , SkSVGIRI                , SkSVGIRI())
    SVG_ATTR(PreserveAspectRatio, SkSVGPreserveAspectRatio, SkSVGPreserveAspectRatio())

protected:
    bool parseAndSetAttribute(const char*, const char*) override;

    sk_sp<SkImageFilter> onMakeImageFilter(const SkSVGRenderContext&,
                                           const SkSVGFilterContext&) const override;

    std::vector<SkSVGFeInputType> getInputs() const override { return {}; }

private:
    SkSVGFeImage() : INHERITED(SkSVGTag::kFeImage) {}

    using INHERITED = SkSVGFe;
};

#endif  // SkSVGFeImage_DEFINED
