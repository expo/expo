/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi28_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;

import abi28_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import javax.annotation.Nullable;

/**
 * Shadow node for virtual TextPath view
 */
class TextPathShadowNode extends TextShadowNode {

    private String mHref;
    private TextPathSide mSide;
    private TextPathMidLine mMidLine;
    private @Nullable String mStartOffset;
    private TextPathMethod mMethod = TextPathMethod.align;
    private TextPathSpacing mSpacing = TextPathSpacing.exact;

    @ReactProp(name = "href")
    public void setHref(String href) {
        mHref = href;
        markUpdated();
    }

    @ReactProp(name = "startOffset")
    public void setStartOffset(@Nullable String startOffset) {
        mStartOffset = startOffset;
        markUpdated();
    }

    @ReactProp(name = "method")
    public void setMethod(@Nullable String method) {
        mMethod = TextPathMethod.valueOf(method);
        markUpdated();
    }

    @ReactProp(name = "spacing")
    public void setSpacing(@Nullable String spacing) {
        mSpacing = TextPathSpacing.valueOf(spacing);
        markUpdated();
    }

    @ReactProp(name = "side")
    public void setSide(@Nullable String side) {
        mSide = TextPathSide.valueOf(side);
        markUpdated();
    }

    @ReactProp(name = "midLine")
    public void setSharp(@Nullable String midLine) {
        mMidLine = TextPathMidLine.valueOf(midLine);
        markUpdated();
    }

    @SuppressWarnings("unused")
    TextPathMethod getMethod() {
        return mMethod;
    }

    @SuppressWarnings("unused")
    TextPathSpacing getSpacing() {
        return mSpacing;
    }

    TextPathSide getSide() {
        return mSide;
    }

    TextPathMidLine getMidLine() {
        return mMidLine;
    }

    String getStartOffset() {
        return mStartOffset;
    }

    @Override
    public void draw(Canvas canvas, Paint paint, float opacity) {
        drawGroup(canvas, paint, opacity);
    }

    public Path getPath() {
        SvgViewShadowNode svg = getSvgShadowNode();
        VirtualNode template = svg.getDefinedTemplate(mHref);

        if (template == null || template.getClass() != PathShadowNode.class) {
            // warning about this.
            return null;
        }

        PathShadowNode path = (PathShadowNode)template;
        return path.getPath();
    }

    @Override
    protected Path getPath(Canvas canvas, Paint paint) {
        return getGroupPath(canvas, paint);
    }

    @Override
    protected void pushGlyphContext() {
        // do nothing
    }

    @Override
    protected void popGlyphContext() {
        // do nothing
    }
}
