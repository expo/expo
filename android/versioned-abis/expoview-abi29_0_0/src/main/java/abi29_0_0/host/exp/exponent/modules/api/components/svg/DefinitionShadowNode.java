/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi29_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Point;

/**
 * Shadow node for virtual Definition type views
 */
class DefinitionShadowNode extends VirtualNode {

    public void draw(Canvas canvas, Paint paint, float opacity) {}

    @Override
    public boolean isResponsible() {
        return false;
    }

    @Override
    protected Path getPath(Canvas canvas, Paint paint) {
        return null;
    }

    @Override
    public int hitTest(Point point, Matrix matrix) {
        return -1;
    }
}
