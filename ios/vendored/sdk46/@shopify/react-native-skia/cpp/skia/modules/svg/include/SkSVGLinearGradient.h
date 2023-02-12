/*
 * Copyright 2016 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGLinearGradient_DEFINED
#define SkSVGLinearGradient_DEFINED

#include "modules/svg/include/SkSVGGradient.h"
#include "modules/svg/include/SkSVGTypes.h"

class SkSVGLinearGradient final : public SkSVGGradient {
public:
    static sk_sp<SkSVGLinearGradient> Make() {
        return sk_sp<SkSVGLinearGradient>(new SkSVGLinearGradient());
    }

    SVG_ATTR(X1, SkSVGLength, SkSVGLength(0  , SkSVGLength::Unit::kPercentage))
    SVG_ATTR(Y1, SkSVGLength, SkSVGLength(0  , SkSVGLength::Unit::kPercentage))
    SVG_ATTR(X2, SkSVGLength, SkSVGLength(100, SkSVGLength::Unit::kPercentage))
    SVG_ATTR(Y2, SkSVGLength, SkSVGLength(0  , SkSVGLength::Unit::kPercentage))

protected:
    bool parseAndSetAttribute(const char*, const char*) override;

    sk_sp<SkShader> onMakeShader(const SkSVGRenderContext&,
                                 const SkColor4f*, const SkScalar*, int count,
                                 SkTileMode, const SkMatrix&) const override;
private:
    SkSVGLinearGradient();

    using INHERITED = SkSVGGradient;
};

#endif // SkSVGLinearGradient_DEFINED
