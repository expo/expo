/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi16_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Paint;

/**
 * Shadow node for virtual RNSVGPath view
 */
public class RNSVGDefsShadowNode extends RNSVGDefinitionShadowNode {

    @Override
    public void draw(Canvas canvas, Paint paint, float opacity) {
        traverseChildren(new NodeRunnable() {
            public boolean run(RNSVGVirtualNode node) {
                node.saveDefinition();
                return true;
            }
        });
        NodeRunnable markUpdateSeenRecursive = new NodeRunnable() {
            public boolean run(RNSVGVirtualNode node) {
                node.markUpdateSeen();
                node.traverseChildren(this);
                return true;
            }
        };
        traverseChildren(markUpdateSeenRecursive);
    }
}
