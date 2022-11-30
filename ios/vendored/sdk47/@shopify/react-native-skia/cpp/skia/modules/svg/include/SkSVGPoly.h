/*
 * Copyright 2016 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGPoly_DEFINED
#define SkSVGPoly_DEFINED

#include "include/core/SkPath.h"
#include "modules/svg/include/SkSVGShape.h"

// Handles <polygon> and <polyline> elements.
class SkSVGPoly final : public SkSVGShape {
public:
    static sk_sp<SkSVGPoly> MakePolygon() {
        return sk_sp<SkSVGPoly>(new SkSVGPoly(SkSVGTag::kPolygon));
    }

    static sk_sp<SkSVGPoly> MakePolyline() {
        return sk_sp<SkSVGPoly>(new SkSVGPoly(SkSVGTag::kPolyline));
    }

    SVG_ATTR(Points, SkSVGPointsType, SkSVGPointsType())

protected:
    bool parseAndSetAttribute(const char*, const char*) override;

    void onDraw(SkCanvas*, const SkSVGLengthContext&, const SkPaint&,
                SkPathFillType) const override;

    SkPath onAsPath(const SkSVGRenderContext&) const override;

    SkRect onObjectBoundingBox(const SkSVGRenderContext&) const override;

private:
    SkSVGPoly(SkSVGTag);

    mutable SkPath fPath;  // mutated in onDraw(), to apply inherited fill types.

    using INHERITED = SkSVGShape;
};

#endif // SkSVGPoly_DEFINED
