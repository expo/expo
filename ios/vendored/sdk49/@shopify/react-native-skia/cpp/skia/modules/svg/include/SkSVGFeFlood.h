/*
 * Copyright 2020 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGFeFlood_DEFINED
#define SkSVGFeFlood_DEFINED

#include "modules/svg/include/SkSVGFe.h"
#include "modules/svg/include/SkSVGTypes.h"

class SK_API SkSVGFeFlood : public SkSVGFe {
public:
    static sk_sp<SkSVGFeFlood> Make() { return sk_sp<SkSVGFeFlood>(new SkSVGFeFlood()); }

protected:
    sk_sp<SkImageFilter> onMakeImageFilter(const SkSVGRenderContext&,
                                           const SkSVGFilterContext&) const override;

    std::vector<SkSVGFeInputType> getInputs() const override { return {}; }

private:
    SkSVGFeFlood() : INHERITED(SkSVGTag::kFeFlood) {}

    SkColor resolveFloodColor(const SkSVGRenderContext&) const;

    using INHERITED = SkSVGFe;
};

#endif  // SkSVGFeFlood_DEFINED
