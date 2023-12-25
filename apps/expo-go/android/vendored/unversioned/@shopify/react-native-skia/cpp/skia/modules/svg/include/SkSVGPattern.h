/*
 * Copyright 2017 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGPattern_DEFINED
#define SkSVGPattern_DEFINED

#include "modules/svg/include/SkSVGHiddenContainer.h"
#include "modules/svg/include/SkSVGTypes.h"

class SkSVGRenderContext;

class SK_API SkSVGPattern final : public SkSVGHiddenContainer {
public:
    static sk_sp<SkSVGPattern> Make() {
        return sk_sp<SkSVGPattern>(new SkSVGPattern());
    }

    SVG_ATTR(Href, SkSVGIRI, SkSVGIRI())
    SVG_OPTIONAL_ATTR(X               , SkSVGLength)
    SVG_OPTIONAL_ATTR(Y               , SkSVGLength)
    SVG_OPTIONAL_ATTR(Width           , SkSVGLength)
    SVG_OPTIONAL_ATTR(Height          , SkSVGLength)
    SVG_OPTIONAL_ATTR(PatternTransform, SkSVGTransformType)

protected:
    SkSVGPattern();

    bool parseAndSetAttribute(const char*, const char*) override;

    bool onAsPaint(const SkSVGRenderContext&, SkPaint*) const override;

private:
    struct PatternAttributes {
        SkTLazy<SkSVGLength>        fX,
                                    fY,
                                    fWidth,
                                    fHeight;
        SkTLazy<SkSVGTransformType> fPatternTransform;
    };

    const SkSVGPattern* resolveHref(const SkSVGRenderContext&, PatternAttributes*) const;
    const SkSVGPattern* hrefTarget(const SkSVGRenderContext&) const;

    // TODO:
    //   - patternUnits
    //   - patternContentUnits

    using INHERITED = SkSVGHiddenContainer;
};

#endif // SkSVGPattern_DEFINED
