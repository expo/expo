/*
 * Copyright 2016 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGShape_DEFINED
#define SkSVGShape_DEFINED

#include "include/core/SkPath.h"
#include "modules/svg/include/SkSVGTransformableNode.h"

class SkSVGLengthContext;
class SkPaint;

class SK_API SkSVGShape : public SkSVGTransformableNode {
public:
    void appendChild(sk_sp<SkSVGNode>) override;

protected:
    SkSVGShape(SkSVGTag);

    void onRender(const SkSVGRenderContext&) const final;

    virtual void onDraw(SkCanvas*, const SkSVGLengthContext&, const SkPaint&,
                        SkPathFillType) const = 0;

private:
    using INHERITED = SkSVGTransformableNode;
};

#endif // SkSVGShape_DEFINED
