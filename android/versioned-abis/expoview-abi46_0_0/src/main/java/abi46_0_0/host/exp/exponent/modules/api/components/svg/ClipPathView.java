/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi46_0_0.host.exp.exponent.modules.api.components.svg;

import android.annotation.SuppressLint;
import android.graphics.Canvas;
import android.graphics.Paint;

import com.facebook.common.logging.FLog;
import abi46_0_0.com.facebook.react.bridge.ReactContext;
import abi46_0_0.com.facebook.react.common.ReactConstants;

@SuppressLint("ViewConstructor")
class ClipPathView extends GroupView {

    public ClipPathView(ReactContext reactContext) {
        super(reactContext);
    }

    @Override
    void draw(Canvas canvas, Paint paint, float opacity) {
        FLog.w(ReactConstants.TAG, "RNSVG: ClipPath can't be drawn, it should be defined as a child component for `Defs` ");
    }

    @Override
    void saveDefinition() {
        getSvgView().defineClipPath(this, mName);
    }

    @Override
    boolean isResponsible() {
        return false;
    }

    @Override
    int hitTest(float[] src) {
        return -1;
    }

    @Override
    void mergeProperties(RenderableView target) {}

    @Override
    void resetProperties() {}
}
