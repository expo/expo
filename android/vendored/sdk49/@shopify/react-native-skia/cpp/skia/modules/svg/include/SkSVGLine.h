/*
 * Copyright 2016 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGLine_DEFINED
#define SkSVGLine_DEFINED

#include "modules/svg/include/SkSVGShape.h"
#include "modules/svg/include/SkSVGTypes.h"

struct SkPoint;

class SkSVGLine final : public SkSVGShape {
public:
    static sk_sp<SkSVGLine> Make() { return sk_sp<SkSVGLine>(new SkSVGLine()); }

    SVG_ATTR(X1, SkSVGLength, SkSVGLength(0))
    SVG_ATTR(Y1, SkSVGLength, SkSVGLength(0))
    SVG_ATTR(X2, SkSVGLength, SkSVGLength(0))
    SVG_ATTR(Y2, SkSVGLength, SkSVGLength(0))

protected:
    bool parseAndSetAttribute(const char*, const char*) override;

    void onDraw(SkCanvas*, const SkSVGLengthContext&, const SkPaint&,
                SkPathFillType) const override;

    SkPath onAsPath(const SkSVGRenderContext&) const override;

private:
    SkSVGLine();

    // resolve and return the two endpoints
    std::tuple<SkPoint, SkPoint> resolve(const SkSVGLengthContext&) const;

    using INHERITED = SkSVGShape;
};

#endif // SkSVGLine_DEFINED
