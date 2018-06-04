/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi28_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Point;

import com.facebook.common.logging.FLog;
import abi28_0_0.com.facebook.react.common.ReactConstants;

/**
 * Shadow node for virtual ClipPath view
 */
class ClipPathShadowNode extends GroupShadowNode {

    @Override
    public void draw(Canvas canvas, Paint paint, float opacity) {
        FLog.w(ReactConstants.TAG, "RNSVG: ClipPath can't be drawn, it should be defined as a child component for `Defs` ");
    }

    @Override
    protected void saveDefinition() {
        getSvgShadowNode().defineClipPath(this, mName);
    }

    @Override
    public boolean isResponsible() {
        return false;
    }

    @Override
    public int hitTest(Point point, Matrix matrix) {
        return -1;
    }

    @Override
    public void mergeProperties(RenderableShadowNode target) {}

    @Override
    public void resetProperties() {}
}
