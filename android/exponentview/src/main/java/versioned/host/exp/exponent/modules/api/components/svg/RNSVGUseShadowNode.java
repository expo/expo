/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package versioned.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Paint;

import com.facebook.common.logging.FLog;
import com.facebook.react.common.ReactConstants;
import com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Shadow node for virtual RNSVGPath view
 */
public class RNSVGUseShadowNode extends RNSVGPathShadowNode {

    private String mHref;
    private String mWidth;
    private String mHeight;

    @ReactProp(name = "href")
    public void setHref(String href) {
        mHref = href;
        markUpdated();
    }

    @ReactProp(name = "width")
    public void setWidth(String width) {
        mWidth = width;
        markUpdated();
    }

    @ReactProp(name = "height")
    public void setHeight(String height) {
        mHeight = height;
        markUpdated();
    }

    public String getWidth() {
        return mWidth;
    }

    public String getHeight() {
        return mHeight;
    }

    @Override
    public void draw(Canvas canvas, Paint paint, float opacity) {
        RNSVGVirtualNode template = getSvgShadowNode().getDefinedTemplate(mHref);

        if (template != null) {
            int count = saveAndSetupCanvas(canvas);

            clip(canvas, paint);
            template.mergeProperties(this, mPropList);
            template.draw(canvas, paint, opacity * mOpacity);
            template.resetProperties();

            restoreCanvas(canvas, count);
            markUpdateSeen();
        } else {
            FLog.w(ReactConstants.TAG, "`Use` element expected a pre-defined svg template as `href` prop, " +
                "template named: " + mHref + " is not defined.");
        }
    }
}
