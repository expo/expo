/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package com.horcrux.svg;

import android.annotation.SuppressLint;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.view.View;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.uimanager.annotations.ReactProp;

@SuppressLint("ViewConstructor")
class ForeignObjectView extends GroupView {

    SVGLength mX;
    SVGLength mY;
    SVGLength mW;
    SVGLength mH;

    public ForeignObjectView(ReactContext reactContext) {
        super(reactContext);
    }

    @Override
    void draw(Canvas canvas, Paint paint, float opacity) {
        float x = (float)relativeOnWidth(mX);
        float y = (float)relativeOnHeight(mY);
        float w = (float)relativeOnWidth(mW);
        float h = (float)relativeOnHeight(mH);
        canvas.translate(x, y);
        canvas.clipRect(0, 0, w, h);
        super.draw(canvas, paint, opacity);
    }

    @Override
    public void onDescendantInvalidated(@NonNull View child, @NonNull View target) {
        super.onDescendantInvalidated(child, target);
        invalidate();
    }

    @ReactProp(name = "x")
    public void setX(Dynamic x) {
        mX = SVGLength.from(x);
        invalidate();
    }

    @ReactProp(name = "y")
    public void setY(Dynamic y) {
        mY = SVGLength.from(y);
        invalidate();
    }

    @ReactProp(name = "width")
    public void setWidth(Dynamic width) {
        mW = SVGLength.from(width);
        invalidate();
    }

    @ReactProp(name = "height")
    public void setHeight(Dynamic height) {
        mH = SVGLength.from(height);
        invalidate();
    }

    void drawGroup(final Canvas canvas, final Paint paint, final float opacity) {
        pushGlyphContext();
        final SvgView svg = getSvgView();
        final GroupView self = this;
        final RectF groupRect = new RectF();
        for (int i = 0; i < getChildCount(); i++) {
            View child = getChildAt(i);
            if (child instanceof MaskView) {
                continue;
            }
            if (child instanceof VirtualView) {
                VirtualView node = ((VirtualView)child);
                if ("none".equals(node.mDisplay)) {
                    continue;
                }
                if (node instanceof RenderableView) {
                    ((RenderableView)node).mergeProperties(self);
                }

                int count = node.saveAndSetupCanvas(canvas, mCTM);
                node.render(canvas, paint, opacity * mOpacity);
                RectF r = node.getClientRect();
                if (r != null) {
                    groupRect.union(r);
                }

                node.restoreCanvas(canvas, count);

                if (node instanceof RenderableView) {
                    ((RenderableView)node).resetProperties();
                }

                if (node.isResponsible()) {
                    svg.enableTouchEvents();
                }
            } else if (child instanceof SvgView) {
                SvgView svgView = (SvgView)child;
                svgView.drawChildren(canvas);
                if (svgView.isResponsible()) {
                    svg.enableTouchEvents();
                }
            } else {
                // Enable rendering other native ancestor views in e.g. masks
                child.draw(canvas);
            }
        }
        this.setClientRect(groupRect);
        popGlyphContext();
    }

    // Enable rendering other native ancestor views in e.g. masks, but don't render them another time
    Bitmap fakeBitmap = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
    Canvas fake = new Canvas(fakeBitmap);

    @Override
    protected void dispatchDraw(Canvas canvas) {
        super.dispatchDraw(fake);
    }

    protected boolean drawChild(Canvas canvas, View child, long drawingTime) {
        return super.drawChild(fake, child, drawingTime);
    }
}
