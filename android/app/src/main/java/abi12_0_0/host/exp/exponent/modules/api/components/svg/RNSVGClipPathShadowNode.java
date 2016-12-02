/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi12_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Point;
import android.view.View;

/**
 * Shadow node for virtual RNSVGClipPath view
 */
public class RNSVGClipPathShadowNode extends RNSVGGroupShadowNode {

    @Override
    protected void saveDefinition() {
        getSvgShadowNode().defineClipPath(this, mName);
    }

    @Override
    public int hitTest(Point point, View view) {
        return -1;
    }
}
