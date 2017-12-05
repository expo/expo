/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi17_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;

import abi17_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import javax.annotation.Nullable;

/**
 * Shadow node for virtual TextPath view
 */
public class TextPathShadowNode extends TextShadowNode {

    private String mHref;
    private @Nullable String mStartOffset;

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

    @Override
    public void draw(Canvas canvas, Paint paint, float opacity) {
        drawGroup(canvas, paint, opacity);
    }

    public BezierTransformer getBezierTransformer() {
        SvgViewShadowNode svg = getSvgShadowNode();
        VirtualNode template = svg.getDefinedTemplate(mHref);

        if (template == null || template.getClass() != PathShadowNode.class) {
            // warning about this.
            return null;
        }

        PathShadowNode path = (PathShadowNode)template;
        return new BezierTransformer(path.getBezierCurves(), relativeOnWidth(mStartOffset));
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
