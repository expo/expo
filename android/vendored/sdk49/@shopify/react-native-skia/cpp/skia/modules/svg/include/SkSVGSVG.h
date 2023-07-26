/*
 * Copyright 2016 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGSVG_DEFINED
#define SkSVGSVG_DEFINED

#include "modules/svg/include/SkSVGContainer.h"
#include "modules/svg/include/SkSVGTypes.h"
#include "src/base/SkTLazy.h"

class SkSVGLengthContext;

class SkSVGSVG : public SkSVGContainer {
public:
    enum class Type {
        kRoot,
        kInner,
    };
    static sk_sp<SkSVGSVG> Make(Type t = Type::kInner) { return sk_sp<SkSVGSVG>(new SkSVGSVG(t)); }

    SVG_ATTR(X                  , SkSVGLength, SkSVGLength(0))
    SVG_ATTR(Y                  , SkSVGLength, SkSVGLength(0))
    SVG_ATTR(Width              , SkSVGLength, SkSVGLength(100, SkSVGLength::Unit::kPercentage))
    SVG_ATTR(Height             , SkSVGLength, SkSVGLength(100, SkSVGLength::Unit::kPercentage))
    SVG_ATTR(PreserveAspectRatio, SkSVGPreserveAspectRatio, SkSVGPreserveAspectRatio())

    SVG_OPTIONAL_ATTR(ViewBox, SkSVGViewBoxType)

    SkSize intrinsicSize(const SkSVGLengthContext&) const;

    void renderNode(const SkSVGRenderContext&, const SkSVGIRI& iri) const;

protected:
    bool onPrepareToRender(SkSVGRenderContext*) const override;

    void onSetAttribute(SkSVGAttribute, const SkSVGValue&) override;

private:
    explicit SkSVGSVG(Type t)
        : INHERITED(SkSVGTag::kSvg)
        , fType(t)
    {}

    // Some attributes behave differently for the outermost svg element.
    const Type fType;

    using INHERITED = SkSVGContainer;
};

#endif // SkSVGSVG_DEFINED
