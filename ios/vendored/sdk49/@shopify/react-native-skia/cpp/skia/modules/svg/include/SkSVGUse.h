/*
 * Copyright 2017 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGUse_DEFINED
#define SkSVGUse_DEFINED

#include "modules/svg/include/SkSVGTransformableNode.h"
#include "modules/svg/include/SkSVGTypes.h"

/**
 * Implements support for <use> (reference) elements.
 * (https://www.w3.org/TR/SVG11/struct.html#UseElement)
 */
class SK_API SkSVGUse final : public SkSVGTransformableNode {
public:
    static sk_sp<SkSVGUse> Make() { return sk_sp<SkSVGUse>(new SkSVGUse()); }

    void appendChild(sk_sp<SkSVGNode>) override;

    SVG_ATTR(X   , SkSVGLength, SkSVGLength(0))
    SVG_ATTR(Y   , SkSVGLength, SkSVGLength(0))
    SVG_ATTR(Href, SkSVGIRI   , SkSVGIRI())

protected:
    bool onPrepareToRender(SkSVGRenderContext*) const override;
    void onRender(const SkSVGRenderContext&) const override;
    SkPath onAsPath(const SkSVGRenderContext&) const override;
    SkRect onObjectBoundingBox(const SkSVGRenderContext&) const override;

private:
    SkSVGUse();

    bool parseAndSetAttribute(const char*, const char*) override;

    using INHERITED = SkSVGTransformableNode;
};

#endif // SkSVGUse_DEFINED
