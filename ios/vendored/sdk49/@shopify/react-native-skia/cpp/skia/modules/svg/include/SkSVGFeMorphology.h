/*
 * Copyright 2020 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGFeMorphology_DEFINED
#define SkSVGFeMorphology_DEFINED

#include "modules/svg/include/SkSVGFe.h"
#include "modules/svg/include/SkSVGTypes.h"

class SkSVGFeMorphology : public SkSVGFe {
public:
    struct Radius {
        SkSVGNumberType fX;
        SkSVGNumberType fY;
    };

    enum class Operator {
        kErode,
        kDilate,
    };

    static sk_sp<SkSVGFeMorphology> Make() {
        return sk_sp<SkSVGFeMorphology>(new SkSVGFeMorphology());
    }

    SVG_ATTR(Operator, Operator, Operator::kErode)
    SVG_ATTR(Radius  , Radius  , Radius({0, 0}))

protected:
    sk_sp<SkImageFilter> onMakeImageFilter(const SkSVGRenderContext&,
                                           const SkSVGFilterContext&) const override;

    std::vector<SkSVGFeInputType> getInputs() const override { return {this->getIn()}; }

    bool parseAndSetAttribute(const char*, const char*) override;

private:
    SkSVGFeMorphology() : INHERITED(SkSVGTag::kFeMorphology) {}

    using INHERITED = SkSVGFe;
};

#endif  // SkSVGFeMorphology_DEFINED
