/*
 * Copyright 2020 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGFe_DEFINED
#define SkSVGFe_DEFINED

#include <vector>

#include "modules/svg/include/SkSVGHiddenContainer.h"

class SkImageFilter;
class SkSVGFilterContext;

class SK_API SkSVGFe : public SkSVGHiddenContainer {
public:
    static bool IsFilterEffect(const sk_sp<SkSVGNode>& node) {
        switch (node->tag()) {
            case SkSVGTag::kFeBlend:
            case SkSVGTag::kFeColorMatrix:
            case SkSVGTag::kFeComposite:
            case SkSVGTag::kFeDiffuseLighting:
            case SkSVGTag::kFeDisplacementMap:
            case SkSVGTag::kFeFlood:
            case SkSVGTag::kFeGaussianBlur:
            case SkSVGTag::kFeImage:
            case SkSVGTag::kFeMorphology:
            case SkSVGTag::kFeOffset:
            case SkSVGTag::kFeSpecularLighting:
            case SkSVGTag::kFeTurbulence:
                return true;
            default:
                return false;
        }
    }

    sk_sp<SkImageFilter> makeImageFilter(const SkSVGRenderContext& ctx,
                                         const SkSVGFilterContext& fctx) const;

    // https://www.w3.org/TR/SVG11/filters.html#FilterPrimitiveSubRegion
    SkRect resolveFilterSubregion(const SkSVGRenderContext&, const SkSVGFilterContext&) const;

    /**
     * Resolves the colorspace within which this filter effect should be applied.
     * Spec: https://www.w3.org/TR/SVG11/painting.html#ColorInterpolationProperties
     * 'color-interpolation-filters' property.
     */
    virtual SkSVGColorspace resolveColorspace(const SkSVGRenderContext&,
                                              const SkSVGFilterContext&) const;

    /** Propagates any inherited presentation attributes in the given context. */
    void applyProperties(SkSVGRenderContext*) const;

    SVG_ATTR(In, SkSVGFeInputType, SkSVGFeInputType())
    SVG_ATTR(Result, SkSVGStringType, SkSVGStringType())
    SVG_OPTIONAL_ATTR(X, SkSVGLength)
    SVG_OPTIONAL_ATTR(Y, SkSVGLength)
    SVG_OPTIONAL_ATTR(Width, SkSVGLength)
    SVG_OPTIONAL_ATTR(Height, SkSVGLength)

protected:
    explicit SkSVGFe(SkSVGTag t) : INHERITED(t) {}

    virtual sk_sp<SkImageFilter> onMakeImageFilter(const SkSVGRenderContext&,
                                                   const SkSVGFilterContext&) const = 0;

    virtual std::vector<SkSVGFeInputType> getInputs() const = 0;

    bool parseAndSetAttribute(const char*, const char*) override;

private:
    /**
     * Resolves the rect specified by the x, y, width and height attributes (if specified) on this
     * filter effect. These attributes are resolved according to the given length context and
     * the value of 'primitiveUnits' on the parent <filter> element.
     */
    SkRect resolveBoundaries(const SkSVGRenderContext&, const SkSVGFilterContext&) const;

    using INHERITED = SkSVGHiddenContainer;
};

#endif  // SkSVGFe_DEFINED
