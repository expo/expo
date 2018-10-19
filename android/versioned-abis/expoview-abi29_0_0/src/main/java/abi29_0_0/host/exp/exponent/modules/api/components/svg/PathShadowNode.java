/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi29_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;

import abi29_0_0.com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Shadow node for virtual Path view
 */
class PathShadowNode extends RenderableShadowNode {

    private Path mPath;

    @ReactProp(name = "d")
    public void setD(String d) {
        PropHelper.PathParser mD = new PropHelper.PathParser(d, mScale);
        mPath = mD.getPath();
        markUpdated();
    }

    @Override
    protected Path getPath(Canvas canvas, Paint paint) {
        return mPath;
    }

    public Path getPath() {
        return mPath;
    }

}
