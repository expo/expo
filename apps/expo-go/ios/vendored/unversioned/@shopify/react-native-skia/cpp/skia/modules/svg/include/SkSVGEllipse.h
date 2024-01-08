/*
 * Copyright 2016 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGEllipse_DEFINED
#define SkSVGEllipse_DEFINED

#include "modules/svg/include/SkSVGShape.h"
#include "modules/svg/include/SkSVGTypes.h"

struct SkRect;

class SK_API SkSVGEllipse final : public SkSVGShape {
public:
    static sk_sp<SkSVGEllipse> Make() { return sk_sp<SkSVGEllipse>(new SkSVGEllipse()); }

    SVG_ATTR(Cx, SkSVGLength, SkSVGLength(0))
    SVG_ATTR(Cy, SkSVGLength, SkSVGLength(0))
    SVG_ATTR(Rx, SkSVGLength, SkSVGLength(0))
    SVG_ATTR(Ry, SkSVGLength, SkSVGLength(0))

protected:
    bool parseAndSetAttribute(const char*, const char*) override;

    void onDraw(SkCanvas*, const SkSVGLengthContext&, const SkPaint&,
                SkPathFillType) const override;

    SkPath onAsPath(const SkSVGRenderContext&) const override;

private:
    SkSVGEllipse();

    SkRect resolve(const SkSVGLengthContext&) const;

    using INHERITED = SkSVGShape;
};

#endif // SkSVGEllipse_DEFINED
