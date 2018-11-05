/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package versioned.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Paint;

import com.facebook.react.uimanager.ReactShadowNode;

/**
 * Shadow node for virtual Defs view
 */
class DefsShadowNode extends DefinitionShadowNode {

    @Override
    public void draw(Canvas canvas, Paint paint, float opacity) {
        NodeRunnable markUpdateSeenRecursive = new NodeRunnable() {
            public void run(ReactShadowNode node) {
                node.markUpdateSeen();
                if (node instanceof VirtualNode) {
                    ((VirtualNode) node).traverseChildren(this);
                } else if (node instanceof SvgViewShadowNode) {
                    ((SvgViewShadowNode) node).traverseChildren(this);
                }
            }
        };
        traverseChildren(markUpdateSeenRecursive);
    }

    void saveDefinition() {
        traverseChildren(new NodeRunnable() {
            public void run(ReactShadowNode node) {
                if (node instanceof VirtualNode) {
                    ((VirtualNode)node).saveDefinition();
                }
            }
        });
    }
}
