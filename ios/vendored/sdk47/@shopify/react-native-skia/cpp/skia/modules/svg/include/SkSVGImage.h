/*
 * Copyright 2021 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGImage_DEFINED
#define SkSVGImage_DEFINED

#include "modules/svg/include/SkSVGTransformableNode.h"
#include "modules/svg/include/SkSVGTypes.h"

namespace skresources {
class ResourceProvider;
}

class SkSVGImage final : public SkSVGTransformableNode {
public:
    static sk_sp<SkSVGImage> Make() {
        return sk_sp<SkSVGImage>(new SkSVGImage());
    }

    void appendChild(sk_sp<SkSVGNode>) override {
        SkDebugf("cannot append child nodes to this element.\n");
    }

    bool onPrepareToRender(SkSVGRenderContext*) const override;
    void onRender(const SkSVGRenderContext&) const override;
    SkPath onAsPath(const SkSVGRenderContext&) const override;
    SkRect onObjectBoundingBox(const SkSVGRenderContext&) const override;

    struct ImageInfo {
        sk_sp<SkImage> fImage;
        SkRect         fDst;
    };
    static ImageInfo LoadImage(const sk_sp<skresources::ResourceProvider>&,
                               const SkSVGIRI&,
                               const SkRect&,
                               SkSVGPreserveAspectRatio);

    SVG_ATTR(X                  , SkSVGLength             , SkSVGLength(0))
    SVG_ATTR(Y                  , SkSVGLength             , SkSVGLength(0))
    SVG_ATTR(Width              , SkSVGLength             , SkSVGLength(0))
    SVG_ATTR(Height             , SkSVGLength             , SkSVGLength(0))
    SVG_ATTR(Href               , SkSVGIRI                , SkSVGIRI())
    SVG_ATTR(PreserveAspectRatio, SkSVGPreserveAspectRatio, SkSVGPreserveAspectRatio())

protected:
    bool parseAndSetAttribute(const char*, const char*) override;

private:
    SkSVGImage() : INHERITED(SkSVGTag::kImage) {}

    using INHERITED = SkSVGTransformableNode;
};

#endif  // SkSVGImage_DEFINED
