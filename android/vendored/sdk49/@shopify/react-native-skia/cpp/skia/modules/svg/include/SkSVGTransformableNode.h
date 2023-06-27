/*
 * Copyright 2016 Google Inc.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

#ifndef SkSVGTransformableNode_DEFINED
#define SkSVGTransformableNode_DEFINED

#include "include/core/SkMatrix.h"
#include "modules/svg/include/SkSVGNode.h"

class SkSVGTransformableNode : public SkSVGNode {
public:
    void setTransform(const SkSVGTransformType& t) { fTransform = t; }

protected:
    SkSVGTransformableNode(SkSVGTag);

    bool onPrepareToRender(SkSVGRenderContext*) const override;

    void onSetAttribute(SkSVGAttribute, const SkSVGValue&) override;

    void mapToParent(SkPath*) const;

    void mapToParent(SkRect*) const;

private:
    // FIXME: should be sparse
    SkSVGTransformType fTransform;

    using INHERITED = SkSVGNode;
};

#endif // SkSVGTransformableNode_DEFINED
