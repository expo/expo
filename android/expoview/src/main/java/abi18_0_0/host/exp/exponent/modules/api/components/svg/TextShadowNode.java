/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi18_0_0.host.exp.exponent.modules.api.components.svg;

import javax.annotation.Nullable;

import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Point;
import android.graphics.PointF;
import android.graphics.Rect;
import android.graphics.RectF;
import android.util.Log;

import abi18_0_0.com.facebook.react.bridge.ReactMethod;
import abi18_0_0.com.facebook.react.bridge.ReadableArray;
import abi18_0_0.com.facebook.react.bridge.ReadableMap;
import abi18_0_0.com.facebook.react.uimanager.ReactShadowNode;
import abi18_0_0.com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Shadow node for virtual Text view
 */

public class TextShadowNode extends GroupShadowNode {

    private static final int TEXT_ANCHOR_AUTO = 0;
    private static final int TEXT_ANCHOR_START = 1;
    private static final int TEXT_ANCHOR_MIDDLE = 2;
    private static final int TEXT_ANCHOR_END = 3;

    private int mTextAnchor = TEXT_ANCHOR_AUTO;
    private @Nullable  ReadableArray mDeltaX;
    private @Nullable ReadableArray mDeltaY;
    private @Nullable String mPositionX;
    private @Nullable String mPositionY;
    private @Nullable ReadableMap mFont;

    private GlyphContext mGlyphContext;
    private TextShadowNode mTextRoot;

    @ReactProp(name = "textAnchor", defaultInt = TEXT_ANCHOR_AUTO)
    public void setTextAnchor(int textAnchor) {
        mTextAnchor = textAnchor;
        markUpdated();
    }

    @ReactProp(name = "deltaX")
    public void setDeltaX(@Nullable ReadableArray deltaX) {
        mDeltaX = deltaX;
        markUpdated();
    }

    @ReactProp(name = "deltaY")
    public void setDeltaY(@Nullable ReadableArray deltaY) {
        mDeltaY = deltaY;
        markUpdated();
    }

    @ReactProp(name = "positionX")
    public void setPositionX(@Nullable String positionX) {
        mPositionX = positionX;
        markUpdated();
    }

    @ReactProp(name = "positionY")
    public void setPositionY(@Nullable String positionY) {
        mPositionY = positionY;
        markUpdated();
    }

    @ReactProp(name = "font")
    public void setFont(@Nullable ReadableMap font) {
        mFont = font;
        markUpdated();
    }

    @Override
    public void draw(Canvas canvas, Paint paint, float opacity) {
        if (opacity > MIN_OPACITY_FOR_DRAW) {
            setupGlyphContext();
            clip(canvas, paint);
            Path path = getGroupPath(canvas, paint);
            Matrix matrix = getAlignMatrix(path);
            canvas.concat(matrix);
            drawGroup(canvas, paint, opacity);
            releaseCachedPath();
        }
    }

    @Override
    protected Path getPath(Canvas canvas, Paint paint) {
        setupGlyphContext();
        Path groupPath = getGroupPath(canvas, paint);
        Matrix matrix = getAlignMatrix(groupPath);
        groupPath.transform(matrix);

        releaseCachedPath();
        return groupPath;
    }

    protected void drawGroup(Canvas canvas, Paint paint, float opacity) {
        pushGlyphContext();
        super.drawGroup(canvas, paint, opacity);
        popGlyphContext();
    }

    private int getTextAnchor() {
        return mTextAnchor;
    }

    private int getComputedTextAnchor() {
        int anchor = mTextAnchor;
        ReactShadowNode shadowNode = this;

        while (shadowNode.getChildCount() > 0 &&
                anchor == TEXT_ANCHOR_AUTO) {
            shadowNode = shadowNode.getChildAt(0);

            if (shadowNode instanceof TextShadowNode) {
                anchor = ((TextShadowNode) shadowNode).getTextAnchor();
            } else {
                break;
            }
        }
        return anchor;
    }

    private TextShadowNode getTextRoot() {
        if (mTextRoot == null) {
            mTextRoot = this;

            while (mTextRoot != null) {
                if (mTextRoot.getClass() == TextShadowNode.class) {
                    break;
                }

                ReactShadowNode parent = mTextRoot.getParent();

                if (!(parent instanceof TextShadowNode)) {
                    //todo: throw exception here
                    mTextRoot = null;
                } else {
                    mTextRoot = (TextShadowNode)parent;
                }
            }
        }

        return mTextRoot;
    }

    private void setupGlyphContext() {
        mGlyphContext = new GlyphContext(mScale, getCanvasWidth(), getCanvasHeight());
    }

    protected void releaseCachedPath() {
        traverseChildren(new NodeRunnable() {
            public boolean run(VirtualNode node) {
                TextShadowNode text = (TextShadowNode)node;
                text.releaseCachedPath();
                return true;
            }
        });
    }

    protected Path getGroupPath(Canvas canvas, Paint paint) {
        pushGlyphContext();
        Path groupPath = super.getPath(canvas, paint);
        popGlyphContext();

        return groupPath;
    }

    protected GlyphContext getGlyphContext() {
        return mGlyphContext;
    }

    protected void pushGlyphContext() {
        getTextRoot().getGlyphContext().pushContext(mFont, mDeltaX, mDeltaY, mPositionX, mPositionY);
    }

    protected void popGlyphContext() {
        getTextRoot().getGlyphContext().popContext();
    }

    protected ReadableMap getFontFromContext() {
        return  getTextRoot().getGlyphContext().getGlyphFont();
    }

    protected PointF getGlyphPointFromContext(float offset, float glyphWidth) {
        return  getTextRoot().getGlyphContext().getNextGlyphPoint(offset, glyphWidth);
    }

    private Matrix getAlignMatrix(Path path) {
        RectF box = new RectF();
        path.computeBounds(box, true);

        float width = box.width();
        float x = 0;

        switch (getComputedTextAnchor()) {
            case TEXT_ANCHOR_MIDDLE:
                x = -width / 2;
                break;
            case TEXT_ANCHOR_END:
                x = -width;
                break;
        }

        Matrix matrix = new Matrix();
        matrix.setTranslate(x, 0);
        return matrix;
    }
}
