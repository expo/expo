/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi28_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Paint;

/**
 * Shadow node for virtual Defs view
 */
class DefsShadowNode extends DefinitionShadowNode {

    @Override
    public void draw(Canvas canvas, Paint paint, float opacity) {
        NodeRunnable markUpdateSeenRecursive = new NodeRunnable() {
            public void run(VirtualNode node) {
                node.markUpdateSeen();
                node.traverseChildren(this);
            }
        };
        traverseChildren(markUpdateSeenRecursive);
    }

    void saveDefinition() {
        traverseChildren(new NodeRunnable() {
            public void run(VirtualNode node) {
                node.saveDefinition();
            }
        });
    }
}
