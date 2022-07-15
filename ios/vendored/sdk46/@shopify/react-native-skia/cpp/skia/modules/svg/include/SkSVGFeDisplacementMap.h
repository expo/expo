/*
 * Copyright 2020 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGFeDisplacementMap_DEFINED
#define SkSVGFeDisplacementMap_DEFINED

#include "modules/svg/include/SkSVGFe.h"
#include "modules/svg/include/SkSVGTypes.h"

class SkSVGFeDisplacementMap : public SkSVGFe {
public:
    using ChannelSelector = SkColorChannel;

    static sk_sp<SkSVGFeDisplacementMap> Make() {
        return sk_sp<SkSVGFeDisplacementMap>(new SkSVGFeDisplacementMap());
    }

    SkSVGColorspace resolveColorspace(const SkSVGRenderContext&,
                                      const SkSVGFilterContext&) const final;

    SVG_ATTR(In2             , SkSVGFeInputType, SkSVGFeInputType())
    SVG_ATTR(XChannelSelector, ChannelSelector , ChannelSelector::kA)
    SVG_ATTR(YChannelSelector, ChannelSelector , ChannelSelector::kA)
    SVG_ATTR(Scale           , SkSVGNumberType , SkSVGNumberType(0))

protected:
    sk_sp<SkImageFilter> onMakeImageFilter(const SkSVGRenderContext&,
                                           const SkSVGFilterContext&) const override;

    std::vector<SkSVGFeInputType> getInputs() const override {
        return {this->getIn(), this->getIn2()};
    }

    bool parseAndSetAttribute(const char*, const char*) override;

private:
    SkSVGFeDisplacementMap() : INHERITED(SkSVGTag::kFeDisplacementMap) {}

    using INHERITED = SkSVGFe;
};

#endif  // SkSVGFeDisplacementMap_DEFINED
