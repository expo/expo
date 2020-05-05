/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi37_0_0.host.exp.exponent.modules.api.components.svg;

import android.annotation.SuppressLint;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.view.View;

import androidx.annotation.NonNull;

import abi37_0_0.com.facebook.react.bridge.Dynamic;
import abi37_0_0.com.facebook.react.bridge.ReactContext;
import abi37_0_0.com.facebook.react.uimanager.annotations.ReactProp;

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
}
