/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi31_0_0.host.exp.exponent.modules.api.components.svg;

import android.annotation.SuppressLint;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;

import com.facebook.common.logging.FLog;
import abi31_0_0.com.facebook.react.bridge.Dynamic;
import abi31_0_0.com.facebook.react.bridge.ReactContext;
import abi31_0_0.com.facebook.react.common.ReactConstants;
import abi31_0_0.com.facebook.react.uimanager.annotations.ReactProp;

@SuppressLint("ViewConstructor")
class UseView extends RenderableView {
    private String mHref;
    private SVGLength mW;
    private SVGLength mH;

    public UseView(ReactContext reactContext) {
        super(reactContext);
    }

    @ReactProp(name = "href")
    public void setHref(String href) {
        mHref = href;
        invalidate();
    }

    @ReactProp(name = "width")
    public void setWidth(Dynamic width) {
        mW = getLengthFromDynamic(width);
        invalidate();
    }

    @ReactProp(name = "height")
    public void setHeight(Dynamic height) {
        mH = getLengthFromDynamic(height);
        invalidate();
    }

    @Override
    void draw(Canvas canvas, Paint paint, float opacity) {
        VirtualView template = getSvgView().getDefinedTemplate(mHref);

        if (template != null) {
            if (template instanceof RenderableView) {
                ((RenderableView)template).mergeProperties(this);
            }

            int count = template.saveAndSetupCanvas(canvas);
            clip(canvas, paint);

            if (template instanceof SymbolView) {
                SymbolView symbol = (SymbolView)template;
                symbol.drawSymbol(canvas, paint, opacity, (float) relativeOnWidth(mW), (float) relativeOnHeight(mH));
            } else {
                template.draw(canvas, paint, opacity * mOpacity);
            }

            this.setClientRect(template.getClientRect());

            template.restoreCanvas(canvas, count);
            if (template instanceof RenderableView) {
                ((RenderableView)template).resetProperties();
            }
        } else {
            FLog.w(ReactConstants.TAG, "`Use` element expected a pre-defined svg template as `href` prop, " +
                "template named: " + mHref + " is not defined.");
        }
    }

    @Override
    int hitTest(float[] src) {
        if (!mInvertible || !mTransformInvertible) {
            return -1;
        }

        float[] dst = new float[2];
        mInvMatrix.mapPoints(dst, src);
        mInvTransform.mapPoints(dst, src);

        VirtualView template = getSvgView().getDefinedTemplate(mHref);
        int hitChild = template.hitTest(dst);
        if (hitChild != -1) {
            return (template.isResponsible() || hitChild != template.getId()) ? hitChild : getId();
        }

        return -1;
    }

    @Override
    Path getPath(Canvas canvas, Paint paint) {
        // todo:
        return new Path();
    }
}
