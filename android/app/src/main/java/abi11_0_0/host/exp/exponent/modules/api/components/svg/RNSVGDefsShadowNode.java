/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi11_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Paint;

/**
 * Shadow node for virtual RNSVGPath view
 */
public class RNSVGDefsShadowNode extends RNSVGDefinitionShadowNode {

    @Override
    public void draw(Canvas canvas, Paint paint, float opacity) {
        int count = saveAndSetupCanvas(canvas);
        clip(canvas, paint);

        for (int i = 0; i < getChildCount(); i++) {
            if (!(getChildAt(i) instanceof RNSVGVirtualNode)) {
                continue;
            }

            RNSVGVirtualNode child = (RNSVGVirtualNode) getChildAt(i);
            child.saveDefinition();
        }

        restoreCanvas(canvas, count);
    }
}
